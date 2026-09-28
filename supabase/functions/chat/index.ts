import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SVC  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_ANON = Deno.env.get('SUPABASE_ANON_KEY')!

// Both this function and log-commit use the service-role key internally (so
// they can write regardless of RLS), which makes this check the only thing
// standing between "anyone with the public anon key" and this app's data.
// `verify_jwt` alone doesn't help — the anon key IS a valid JWT. This
// confirms the caller's bearer token resolves to a real signed-in user.
async function requireAuthenticatedUser(req: Request): Promise<{ id: string } | null> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return null
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON)
  const { data, error } = await authClient.auth.getUser(token)
  if (error || !data.user) return null
  return { id: data.user.id }
}

// "Today" as 'YYYY-MM-DD', resolved in order of trust: the profile's own
// timezone (set by the user, so authoritative) > the client's local date
// (a reasonable guess, but depends on the caller's device being configured
// correctly) > a plain UTC guess (last resort — drifts from any non-UTC
// local date for part of every day).
function resolveToday(profileTimezone?: string | null, clientDate?: string | null): string {
  if (profileTimezone) {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: profileTimezone,
        year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(new Date())
    } catch {
      // Invalid IANA zone somehow made it into the profile — fall through.
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(clientDate ?? '')) return clientDate as string
  return new Date().toISOString().split('T')[0]
}

// Both calls here are low-complexity (a short templated coaching reply, and
// structured JSON extraction) — no reasoning task needs a flagship model.
// Defaults to the current cheapest capable model; override via Supabase
// secrets (`supabase secrets set ANTHROPIC_CHAT_MODEL=...`) to bump later
// without a code deploy.
const CHAT_MODEL       = Deno.env.get('ANTHROPIC_CHAT_MODEL')       ?? 'claude-haiku-4-5-20251001'
const EXTRACTION_MODEL = Deno.env.get('ANTHROPIC_EXTRACTION_MODEL') ?? 'claude-haiku-4-5-20251001'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10MB — mirrors the client-side limit

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

// Parses a data URL into its declared media type + base64 payload, rejecting
// anything that isn't actually an image or is over the size limit. The
// client already validates and re-encodes to JPEG before sending, but this
// function never trusts that alone — it's reachable directly, not just from
// the app.
function parseImageDataUrl(image: string): { mediaType: string; data: string } | { error: string } {
  const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match) return { error: 'Invalid image data' }
  const [, mediaType, data] = match
  if (!ALLOWED_IMAGE_TYPES.has(mediaType)) return { error: `Unsupported image type: ${mediaType}` }
  const approxBytes = Math.ceil((data.length * 3) / 4)
  if (approxBytes > MAX_IMAGE_BYTES) return { error: 'Image exceeds the 10MB limit' }
  return { mediaType, data }
}

// ── Claude API helper ────────────────────────────────────────────────
async function callClaude(opts: {
  model: string
  system?: string
  messages: { role: 'user' | 'assistant'; content: any }[]
  maxTokens?: number
}): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      opts.model,
      max_tokens: opts.maxTokens ?? 512,
      system:     opts.system,
      messages:   opts.messages,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Claude API ${res.status}: ${body}`)
  }
  const data = await res.json()
  return data.content[0].text as string
}

// Turns the newest-first rows from `conversations` into a clean,
// chronological user/assistant history for the chat call.
//
// Older rows were saved in pairs with identical created_at values, so the
// database can hand a pair back in either order. When the assistant row
// sorted first, the history ended on the previous *user* message, which got
// merged with the new one, and the model answered both (re-logging the last
// meal). Ties are broken user-first here, and anything that still doesn't
// alternate cleanly (orphaned turns, a window starting on an assistant
// reply) is dropped so the history always runs user → assistant pairs.
function buildHistory(rows: { role: string; content: string; created_at: string }[]) {
  const sorted = rows
    .filter(r => (r.role === 'user' || r.role === 'assistant') && typeof r.content === 'string' && r.content.trim())
    .sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (diff !== 0) return diff
      return a.role === b.role ? 0 : a.role === 'user' ? -1 : 1
    })

  const history: { role: 'user' | 'assistant'; content: string }[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].role === 'user' && sorted[i + 1].role === 'assistant') {
      history.push({ role: 'user', content: sorted[i].content })
      history.push({ role: 'assistant', content: sorted[i + 1].content })
      i++
    }
  }
  return history
}

const DEFAULT_TRAINING_DAYS: Record<string, string | null> = {
  mon: 'Resistance Training', tue: 'Martial Arts', wed: 'Resistance Training',
  thu: 'Martial Arts',        fri: 'Resistance Training', sat: 'Martial Arts', sun: null,
}
const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAY_LABEL: Record<string, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
}

// Renders {mon: "Resistance Training", tue: "Martial Arts", ...} as the
// grouped "Resistance Training Mon/Wed/Fri · Martial Arts Tue/Thu/Sat" style
// summary the coaching prompt (and the user) expect, skipping rest days.
function formatTrainingDays(trainingDays: Record<string, string | null>): string {
  const byType = new Map<string, string[]>()
  for (const day of DAY_ORDER) {
    const type = trainingDays[day]
    if (!type) continue
    if (!byType.has(type)) byType.set(type, [])
    byType.get(type)!.push(DAY_LABEL[day])
  }
  if (byType.size === 0) return 'No training days set — all rest.'
  return [...byType.entries()].map(([type, days]) => `${type} ${days.join('/')}`).join(' · ')
}

// ── System prompt ────────────────────────────────────────────────────
function buildSystemPrompt(
  profile: Record<string, any> | null,
  targets: Record<string, any> | null,
  totals:  { calories: number; protein_g: number; carbs_g: number; fat_g: number },
): string {
  const t       = targets ?? {}
  const cal     = t.calories     ?? 2250
  const calMin  = t.calories_min ?? 2100
  const calMax  = t.calories_max ?? 2400
  const prot    = t.protein_g    ?? 180
  const carbMin = t.carbs_min_g  ?? 200
  const carbMax = t.carbs_max_g  ?? 230
  const fatMin  = t.fat_min_g    ?? 55
  const fatMax  = t.fat_max_g    ?? 70
  const remCal  = Math.round(cal  - totals.calories)
  const remProt = Math.round(prot - totals.protein_g)
  const name    = profile?.name  ?? 'Medhuvir'
  const age     = profile?.age   ?? 43
  const trainingDays = formatTrainingDays(profile?.training_days ?? DEFAULT_TRAINING_DAYS)

  return `You are HekBot — the personal AI nutrition coach for ${name}.
Your style: Coach Josh — direct, succinct, supportive. Every nutritional insight connects to athletic performance and discipline. Never lecture. Coach.

PROFILE
Name: ${name} | Age: ${age} | 5'10"
Training: ${trainingDays}
Program: Retatrutide-assisted fat loss cut

DAILY TARGETS
Calories : ${cal} kcal  (acceptable ${calMin}–${calMax})
Protein  : ${prot}g  ← #1 priority, non-negotiable
Carbs    : ${carbMin}–${carbMax}g
Fat      : ${fatMin}–${fatMax}g

TODAY'S RUNNING TOTALS  (sourced from database — accurate)
Consumed : ${Math.round(totals.calories)} kcal | ${Math.round(totals.protein_g)}g protein | ${Math.round(totals.carbs_g)}g carbs | ${Math.round(totals.fat_g)}g fat
Remaining: ${remCal} kcal | ${remProt}g protein

MILESTONES
Phase I — Sub-200 lbs by August 18 2026
Phase II — 190 lbs by October 13 2026

RULES
1. Keep responses to 2–4 sentences unless a full summary is explicitly requested.
2. NEVER calculate totals yourself — the database numbers above are the source of truth.
3. When food is logged: brief acknowledgement + how it fits the plan + remaining macro context.
4. When weight/waist is logged: acknowledge the number, note the trend direction if relevant.
5. When a workout is logged: acknowledge it and connect to nutrition/recovery.
6. When a summary is requested: use the exact numbers above, be specific.
7. When the user asks to change their weekly training schedule/days: restate what you understood the new schedule to be, then tell them to tap "Confirm & Log" on the card below to save it. NEVER say or imply the schedule is "confirmed", "locked in", "saved", or "updated" — you have no way to know that, and nothing is written until they tap that button. This applies even if their next message just says "confirm" or "yes" — that plain text does NOT save anything; only the button does. If they say "confirm" with no schedule details in the message, tell them to use the button on the card above, don't declare success.
8. Tone: warm, direct, performance-focused. Never preachy.`
}

// ── Unified extraction prompt ─────────────────────────────────────────
// Returns one JSON object covering all loggable data types. The current
// training schedule is interpolated in so the model can resolve relative/
// partial edits ("move Saturday to Sunday instead") against what's actually
// set today, rather than guessing at a full week from a partial instruction.
function buildExtractionSystem(currentTrainingDays: Record<string, string | null>): string {
  return `You extract loggable fitness data from messages. Return ONLY a valid JSON object — no explanation, no markdown, no code fences.

Always return this exact shape:
{
  "food_items": [],
  "body_entry": null,
  "workout_entry": null,
  "training_schedule": null
}

food_items — array of food/drink items (empty array if none):
{"food_item":"string","meal_type":"breakfast|lunch|dinner|snack|drink","kcal":0,"protein_g":0,"carbs_g":0,"fat_g":0,"confidence":"high|medium|low"}
- One object per distinct food/drink item
- Include caloric beverages (shakes, juice, milk, alcohol); skip plain water and black coffee

PORTION SIZING — this is critical, get it right:
- Always parse the exact quantity/portion stated and compute macros for THAT amount — never default to a "typical" full serving when a different amount is given.
- Recognize fractions ("half a bagel", "1/2 cup", "a quarter of the pizza", "two-thirds"), weights ("4oz chicken breast", "150g rice", "1lb"), volumes ("1 cup", "2 tbsp", "8oz glass"), counts ("2 eggs", "3 slices", "a dozen"), and vague-but-real sizes ("a small apple", "a large fries", "a couple tablespoons" ≈ 2 tbsp, "a handful" ≈ 1oz/28g).
- To compute: start from a standard reference weight/size for one whole unit of that food (e.g. one bagel ≈ 95g, one large egg ≈ 50g, one slice of bread ≈ 28g, one medium banana ≈ 118g, one chicken breast ≈ 6oz/170g raw or ~4-5oz cooked), then scale ALL macros (kcal, protein_g, carbs_g, fat_g) linearly by the stated fraction/weight/count. "Half a bagel" = exactly half the macros of one whole bagel, not a full bagel's worth.
- Weight/volume units given explicitly (oz, g, lb, cup, tbsp) are ground truth — use them directly instead of guessing a reference size, and convert to grams as needed (1oz = 28.35g).
- Put the parsed portion in food_item itself so it's visible for review, e.g. "Bagel (1/2)", "Grilled chicken breast (4oz)", "Rice (150g)" — don't silently absorb the portion into just the numbers.
- If NO quantity is stated at all (just "a bagel" or "chicken breast" with no size/weight), assume exactly ONE standard unit/serving and say so plainly in food_item (e.g. "Bagel") — don't invent a quantity that wasn't said.
- confidence: "high" for items with an explicit quantity (fraction, weight, volume, or count); "medium" for a bare singular item with no stated quantity (assumed 1 unit); "low" for vague descriptions with no clear food or amount

body_entry — if user mentions body weight or waist, otherwise null:
{"weight_lbs": number|null, "waist_cm": number|null}
- Extract weight_lbs if user says "weighed X", "I'm at X lbs", "X pounds this morning", etc.
- Extract waist_cm if user mentions waist measurement (convert inches to cm: ×2.54)
- At least one field must be non-null to include body_entry

workout_entry — if user mentions completing a workout, otherwise null:
{"workout_type":"Resistance Training|Martial Arts|Other","workout_name":null,"duration_min":null,"calories_burned":null}
- workout_type: "Resistance Training" for gym/weights/lifting; "Martial Arts" for BJJ/MMA/boxing/jiu-jitsu/martial arts; "Other" for everything else
- duration_min and calories_burned: only include if explicitly stated, otherwise null

training_schedule — if the user asks to change, set, update, or move their WEEKLY training days/plan (not a single day's completed workout), otherwise null:
{"mon":"Resistance Training"|"Martial Arts"|"Other"|null, "tue":..., "wed":..., "thu":..., "fri":..., "sat":..., "sun":...}
- The user's CURRENT schedule is: ${JSON.stringify(currentTrainingDays)}
- Start from the current schedule and apply only the change described — always return all 7 days (mon..sun), carrying over any day the user didn't mention
- null means a rest day
- Do NOT set this for "I trained today" / "logged a workout" style messages — that's workout_entry, not a schedule change`
}

// ── Main handler ─────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  const user = await requireAuthenticatedUser(req)
  if (!user) return jsonError('Sign in required.', 401)

  try {
    const { message, image, client_date } = await req.json()
    const msg = (message ?? '').trim()
    if (!msg) {
      return jsonError('message is required', 400)
    }

    let parsedImage: { mediaType: string; data: string } | null = null
    if (image) {
      const result = parseImageDataUrl(image as string)
      if ('error' in result) return jsonError(result.error, 400)
      parsedImage = result
    }

    const db = createClient(SUPABASE_URL, SUPABASE_SVC)

    // The profile's own timezone is the authoritative source for "today" —
    // fetched first since everything else below depends on it. Falls back to
    // the client's local date, then a plain UTC guess, only if the profile
    // has no timezone set for some reason.
    const profileRes = await db.from('profiles').select('*').limit(1).single()
    if (profileRes.error) console.error('[chat] profiles:', profileRes.error.message)

    const todayStr = resolveToday(profileRes.data?.timezone, client_date)

    // Fetch the rest of the context in parallel
    const [targetsRes, logsRes, historyRes] = await Promise.all([
      db.from('targets').select('*').order('effective_from', { ascending: false }).limit(1).single(),
      db.from('food_logs').select('calories, protein_g, carbs_g, fat_g').eq('log_date', todayStr),
      db.from('conversations').select('role, content, created_at').order('created_at', { ascending: false }).limit(20),
    ])

    if (targetsRes.error)  console.error('[chat] targets:',  targetsRes.error.message)
    if (logsRes.error)     console.error('[chat] food_logs:', logsRes.error.message)
    if (historyRes.error)  console.warn('[chat] conversations:', historyRes.error.message)

    const todayTotals = (logsRes.data ?? []).reduce(
      (acc: any, r: any) => ({
        calories:  acc.calories  + (Number(r.calories)  || 0),
        protein_g: acc.protein_g + (Number(r.protein_g) || 0),
        carbs_g:   acc.carbs_g   + (Number(r.carbs_g)   || 0),
        fat_g:     acc.fat_g     + (Number(r.fat_g)     || 0),
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
    )

    const history = buildHistory((historyRes.data ?? []) as any[])

    const userContent: any[] = []
    if (parsedImage) {
      userContent.push({
        type: 'image',
        source: { type: 'base64', media_type: parsedImage.mediaType, data: parsedImage.data },
      })
    }
    userContent.push({ type: 'text', text: msg })

    const conversationMessages = [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user' as const, content: parsedImage ? userContent : msg },
    ]

    const systemPrompt = buildSystemPrompt(profileRes.data, targetsRes.data, todayTotals)
    const currentTrainingDays = profileRes.data?.training_days ?? DEFAULT_TRAINING_DAYS

    // Fire chat + extraction in parallel
    const [reply, extractionRaw] = await Promise.all([
      callClaude({
        model:     CHAT_MODEL,
        system:    systemPrompt,
        messages:  conversationMessages,
        maxTokens: 512,
      }),
      callClaude({
        model:     EXTRACTION_MODEL,
        system:    buildExtractionSystem(currentTrainingDays),
        messages:  [{ role: 'user', content: parsedImage ? userContent : msg }],
        maxTokens: 1024,
      }),
    ])

    console.log('[chat] extraction raw:', extractionRaw)

    // ── Parse extraction — nothing is written here. This is a preview only;
    // the client reviews/edits it and confirms via the log-commit function. ──
    let foodItems:        Record<string, any>[] = []
    let bodyEntry:         Record<string, any> | null = null
    let workoutEntry:      Record<string, any> | null = null
    let trainingSchedule:  Record<string, any> | null = null

    try {
      const cleaned = extractionRaw
        .replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim()
      const extracted = JSON.parse(cleaned)

      foodItems = (extracted.food_items ?? []).filter(
        (item: any) => item.food_item && (item.confidence === 'high' || item.confidence === 'medium'),
      )
      const body = extracted.body_entry
      if (body && (body.weight_lbs != null || body.waist_cm != null)) bodyEntry = body

      const workout = extracted.workout_entry
      if (workout?.workout_type) workoutEntry = workout

      const schedule = extracted.training_schedule
      if (schedule && DAY_ORDER.some(day => day in schedule)) {
        trainingSchedule = Object.fromEntries(DAY_ORDER.map(day => [day, schedule[day] ?? null]))
      }

      console.log(
        '[chat] extracted —',
        `food: ${foodItems.length}`,
        `weight: ${bodyEntry ? 'yes' : 'no'}`,
        `workout: ${workoutEntry ? 'yes' : 'no'}`,
        `training_schedule: ${trainingSchedule ? 'yes' : 'no'}`,
      )
    } catch (parseErr) {
      console.error('[chat] extraction parse error:', parseErr, '| raw:', extractionRaw)
    }

    // Save conversation — soft failure. Both rows go in one insert, so a
    // DEFAULT now() would give them the exact same created_at and leave their
    // order up to chance on the next read. Stamp them explicitly instead.
    const savedAt = Date.now()
    const { error: convErr } = await db.from('conversations').insert([
      { role: 'user',      content: msg,   created_at: new Date(savedAt).toISOString()     },
      { role: 'assistant', content: reply, created_at: new Date(savedAt + 1).toISOString() },
    ])
    if (convErr) console.warn('[chat] conversations insert:', convErr.message)

    return new Response(
      JSON.stringify({
        reply,
        extraction: {
          log_date:          todayStr,
          source:            parsedImage ? 'image' : 'text',
          raw_input:         msg,
          food_items:        foodItems,
          body_entry:        bodyEntry,
          workout_entry:     workoutEntry,
          training_schedule: trainingSchedule,
        },
      }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    console.error('[chat] unhandled error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
