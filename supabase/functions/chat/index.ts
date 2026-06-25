import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SVC  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  return `You are HekBot — the personal AI nutrition coach for ${name}.
Your style: Coach Josh — direct, succinct, supportive. Every nutritional insight connects to athletic performance and discipline. Never lecture. Coach.

PROFILE
Name: ${name} | Age: ${age} | 5'10"
Training: Resistance Training Mon/Wed/Fri · Martial Arts Tue/Thu/Sat
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
7. Tone: warm, direct, performance-focused. Never preachy.`
}

// ── Unified extraction prompt ─────────────────────────────────────────
// Returns one JSON object covering all three loggable data types.
const EXTRACTION_SYSTEM = `You extract loggable fitness data from messages. Return ONLY a valid JSON object — no explanation, no markdown, no code fences.

Always return this exact shape:
{
  "food_items": [],
  "body_entry": null,
  "workout_entry": null
}

food_items — array of food/drink items (empty array if none):
{"food_item":"string","meal_type":"breakfast|lunch|dinner|snack|drink","kcal":0,"protein_g":0,"carbs_g":0,"fat_g":0,"confidence":"high|medium|low"}
- One object per distinct food/drink item
- Include caloric beverages (shakes, juice, milk, alcohol); skip plain water and black coffee
- confidence: "high" for specific items with quantities, "low" for vague descriptions

body_entry — if user mentions body weight or waist, otherwise null:
{"weight_lbs": number|null, "waist_cm": number|null}
- Extract weight_lbs if user says "weighed X", "I'm at X lbs", "X pounds this morning", etc.
- Extract waist_cm if user mentions waist measurement (convert inches to cm: ×2.54)
- At least one field must be non-null to include body_entry

workout_entry — if user mentions completing a workout, otherwise null:
{"workout_type":"Resistance Training|Martial Arts|Other","workout_name":null,"duration_min":null,"calories_burned":null}
- workout_type: "Resistance Training" for gym/weights/lifting; "Martial Arts" for BJJ/MMA/boxing/jiu-jitsu/martial arts; "Other" for everything else
- duration_min and calories_burned: only include if explicitly stated, otherwise null`

// ── Main handler ─────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const { message, image } = await req.json()
    const msg = (message ?? '').trim()
    if (!msg) {
      return new Response(JSON.stringify({ error: 'message is required' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const db       = createClient(SUPABASE_URL, SUPABASE_SVC)
    const todayStr = new Date().toISOString().split('T')[0]

    // Fetch context in parallel
    const [profileRes, targetsRes, logsRes, historyRes] = await Promise.all([
      db.from('profiles').select('*').limit(1).single(),
      db.from('targets').select('*').order('effective_from', { ascending: false }).limit(1).single(),
      db.from('food_logs').select('calories, protein_g, carbs_g, fat_g').eq('log_date', todayStr),
      db.from('conversations').select('role, content').order('created_at', { ascending: false }).limit(20),
    ])

    if (profileRes.error)  console.error('[chat] profiles:', profileRes.error.message)
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

    const history: { role: 'user' | 'assistant'; content: string }[] =
      ((historyRes.data ?? []) as any[]).reverse()

    const userContent: any[] = []
    if (image) {
      const b64 = (image as string).replace(/^data:image\/\w+;base64,/, '')
      userContent.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } })
    }
    userContent.push({ type: 'text', text: msg })

    const conversationMessages = [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user' as const, content: image ? userContent : msg },
    ]

    const systemPrompt = buildSystemPrompt(profileRes.data, targetsRes.data, todayTotals)

    // Fire chat + extraction in parallel
    const [reply, extractionRaw] = await Promise.all([
      callClaude({
        model:     'claude-sonnet-4-6',
        system:    systemPrompt,
        messages:  conversationMessages,
        maxTokens: 512,
      }),
      callClaude({
        model:     'claude-haiku-4-5-20251001',
        system:    EXTRACTION_SYSTEM,
        messages:  [{ role: 'user', content: image ? userContent : msg }],
        maxTokens: 1024,
      }),
    ])

    console.log('[chat] extraction raw:', extractionRaw)

    // ── Parse + persist all data types ──────────────────────────────
    const loggedFood:    Record<string, any>[] = []
    let   loggedWeight:  Record<string, any> | null = null
    let   loggedWorkout: Record<string, any> | null = null

    try {
      const cleaned = extractionRaw
        .replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim()
      const extracted = JSON.parse(cleaned)

      // ── Food items ─────────────────────────────────────────────────
      for (const item of (extracted.food_items ?? [])) {
        if (!item.food_item) continue
        if (item.confidence !== 'high' && item.confidence !== 'medium') {
          console.log('[chat] skipping low-confidence food:', item.food_item)
          continue
        }
        const coreRow = {
          log_date:  todayStr,
          food_name: item.food_item,
          calories:  Math.round(item.kcal ?? 0),
          protein_g: Number((item.protein_g ?? 0).toFixed(1)),
          carbs_g:   Number((item.carbs_g   ?? 0).toFixed(1)),
          fat_g:     Number((item.fat_g     ?? 0).toFixed(1)),
        }
        const { error: extErr } = await db.from('food_logs').insert({
          ...coreRow, meal_type: item.meal_type ?? null, confidence: item.confidence, raw_input: msg, source: image ? 'image' : 'text',
        })
        if (extErr) {
          console.warn('[chat] food extended insert failed, trying core:', extErr.message)
          const { error: coreErr } = await db.from('food_logs').insert(coreRow)
          if (coreErr) console.error('[chat] food core insert failed:', coreErr.message)
          else loggedFood.push(item)
        } else {
          loggedFood.push(item)
        }
      }

      // ── Body entry (weight / waist) ─────────────────────────────────
      const body = extracted.body_entry
      if (body && (body.weight_lbs != null || body.waist_cm != null)) {
        const row: Record<string, any> = { checkin_date: todayStr }
        if (body.weight_lbs != null) row.weight_lbs = Number(body.weight_lbs)
        if (body.waist_cm   != null) row.waist_cm   = Number(body.waist_cm)

        // Upsert — if a check-in already exists for today, update it
        const { error: bodyErr } = await db
          .from('weekly_checkins')
          .upsert(row, { onConflict: 'checkin_date' })

        if (bodyErr) {
          console.error('[chat] body upsert failed:', bodyErr.message)
        } else {
          loggedWeight = body
          console.log('[chat] body logged:', JSON.stringify(body))
        }
      }

      // ── Workout entry ───────────────────────────────────────────────
      const workout = extracted.workout_entry
      if (workout?.workout_type) {
        const row: Record<string, any> = {
          log_date:     todayStr,
          workout_type: workout.workout_type,
        }
        if (workout.workout_name)    row.workout_name    = workout.workout_name
        if (workout.duration_min)    row.duration_min    = Number(workout.duration_min)
        if (workout.calories_burned) row.calories_burned = Number(workout.calories_burned)

        const { error: workoutErr } = await db.from('workout_logs').insert(row)
        if (workoutErr) {
          console.error('[chat] workout insert failed:', workoutErr.message)
        } else {
          loggedWorkout = workout
          console.log('[chat] workout logged:', workout.workout_type)
        }
      }

      console.log(
        '[chat] logged —',
        `food: ${loggedFood.length}`,
        `weight: ${loggedWeight ? 'yes' : 'no'}`,
        `workout: ${loggedWorkout ? 'yes' : 'no'}`,
      )
    } catch (parseErr) {
      console.error('[chat] extraction parse error:', parseErr, '| raw:', extractionRaw)
    }

    // Save conversation — soft failure
    const { error: convErr } = await db.from('conversations').insert([
      { role: 'user',      content: msg   },
      { role: 'assistant', content: reply },
    ])
    if (convErr) console.warn('[chat] conversations insert:', convErr.message)

    return new Response(
      JSON.stringify({
        reply,
        logged: {
          food:    loggedFood.length > 0 ? loggedFood : null,
          weight:  loggedWeight,
          workout: loggedWorkout,
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
