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
4. When a summary is requested: use the exact numbers above, be specific.
5. Tone: warm, direct, performance-focused. Never preachy.`
}

// ── Extraction prompt ────────────────────────────────────────────────
const EXTRACTION_SYSTEM = `You extract food and drink items from messages and estimate macronutrients. Return ONLY a valid JSON object — no explanation, no markdown, no code fences.

If a loggable food or drink is present:
{"food_item":"string","meal_type":"breakfast","kcal":0,"protein_g":0,"carbs_g":0,"fat_g":0,"confidence":"high"}

meal_type must be one of: breakfast, lunch, dinner, snack, drink
confidence must be one of: high, medium, low

If no loggable item is present:
{"food_item":null}

Notes: include caloric beverages; skip plain water and black coffee (zero-cal). Use "low" for vague descriptions, "high" for specific items with quantities.`

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

    // Fetch context in parallel — errors are soft (we fall back to defaults)
    const [profileRes, targetsRes, logsRes, historyRes] = await Promise.all([
      db.from('profiles').select('*').limit(1).single(),
      db.from('targets').select('*').order('effective_from', { ascending: false }).limit(1).single(),
      db.from('food_logs').select('calories, protein_g, carbs_g, fat_g').eq('log_date', todayStr),
      db.from('conversations').select('role, content').order('created_at', { ascending: false }).limit(20),
    ])

    if (profileRes.error)  console.error('[chat] profiles fetch:', profileRes.error.message)
    if (targetsRes.error)  console.error('[chat] targets fetch:',  targetsRes.error.message)
    if (logsRes.error)     console.error('[chat] food_logs fetch:', logsRes.error.message)
    if (historyRes.error)  console.error('[chat] conversations fetch:', historyRes.error.message)

    // Sum today's totals
    const todayTotals = (logsRes.data ?? []).reduce(
      (acc: any, r: any) => ({
        calories:  acc.calories  + (Number(r.calories)  || 0),
        protein_g: acc.protein_g + (Number(r.protein_g) || 0),
        carbs_g:   acc.carbs_g   + (Number(r.carbs_g)   || 0),
        fat_g:     acc.fat_g     + (Number(r.fat_g)     || 0),
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
    )

    // Conversation history in chronological order
    const history: { role: 'user' | 'assistant'; content: string }[] =
      ((historyRes.data ?? []) as any[]).reverse()

    // Build user content (text + optional image)
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
      callClaude({ model: 'claude-sonnet-4-6', system: systemPrompt, messages: conversationMessages, maxTokens: 512 }),
      callClaude({ model: 'claude-haiku-4-5-20251001', system: EXTRACTION_SYSTEM, messages: [{ role: 'user', content: image ? userContent : msg }], maxTokens: 256 }),
    ])

    console.log('[chat] extraction raw:', extractionRaw)

    // Parse + log food item
    let logged: Record<string, any> | null = null
    try {
      // Strip any accidental markdown fences Claude might add
      const cleaned = extractionRaw.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
      const parsed  = JSON.parse(cleaned)

      if (parsed.food_item && (parsed.confidence === 'high' || parsed.confidence === 'medium')) {
        // Use only core columns — resilient whether or not migration 002 has run
        const coreInsert: Record<string, any> = {
          log_date:  todayStr,
          food_name: parsed.food_item,
          calories:  Math.round(parsed.kcal ?? 0),
          protein_g: Number((parsed.protein_g ?? 0).toFixed(1)),
          carbs_g:   Number((parsed.carbs_g   ?? 0).toFixed(1)),
          fat_g:     Number((parsed.fat_g     ?? 0).toFixed(1)),
        }

        // Extended columns — only added if migration 002 ran
        const extendedInsert = {
          ...coreInsert,
          meal_type:  parsed.meal_type ?? null,
          confidence: parsed.confidence,
          raw_input:  msg,
          source:     image ? 'image' : 'text',
        }

        // Try extended insert first, fall back to core-only on error
        const { error: extErr } = await db.from('food_logs').insert(extendedInsert)
        if (extErr) {
          console.warn('[chat] extended insert failed, trying core-only:', extErr.message)
          const { error: coreErr } = await db.from('food_logs').insert(coreInsert)
          if (coreErr) {
            console.error('[chat] core insert failed:', coreErr.message)
          } else {
            logged = parsed
            console.log('[chat] logged (core):', parsed.food_item)
          }
        } else {
          logged = parsed
          console.log('[chat] logged (extended):', parsed.food_item)
        }
      } else {
        console.log('[chat] no food to log — food_item:', parsed.food_item, 'confidence:', parsed.confidence)
      }
    } catch (parseErr) {
      console.error('[chat] extraction parse error:', parseErr, '| raw:', extractionRaw)
    }

    // Save conversation turns — soft failure, never blocks the reply
    const { error: convErr } = await db.from('conversations').insert([
      { role: 'user',      content: msg   },
      { role: 'assistant', content: reply },
    ])
    if (convErr) console.warn('[chat] conversations insert failed:', convErr.message)

    return new Response(JSON.stringify({ reply, logged }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('[chat] unhandled error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
