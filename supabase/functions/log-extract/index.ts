import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SVC  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EXTRACTION_SYSTEM = `You extract food and drink items from messages and estimate macronutrients. Return ONLY a valid JSON object — no explanation, no markdown.

If a loggable food or drink is present:
{"food_item":"string","meal_type":"breakfast"|"lunch"|"dinner"|"snack"|"drink","kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number,"confidence":"high"|"medium"|"low"}

If no loggable item is present:
{"food_item":null}

Notes: include caloric beverages; skip plain water and black coffee (zero-cal). Use "low" for vague descriptions, "high" for specific items with quantities.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const { message, image, date } = await req.json()
    const msg = (message ?? '').trim()
    if (!msg && !image) {
      return new Response(JSON.stringify({ error: 'message or image required' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const logDate = date ?? new Date().toISOString().split('T')[0]

    // Build user content
    const userContent: any[] = []
    if (image) {
      const b64 = (image as string).replace(/^data:image\/\w+;base64,/, '')
      userContent.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } })
    }
    if (msg) userContent.push({ type: 'text', text: msg })

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system:     EXTRACTION_SYSTEM,
        messages:   [{ role: 'user', content: image ? userContent : msg }],
      }),
    })

    if (!res.ok) throw new Error(`Claude ${res.status}: ${await res.text()}`)
    const claudeData = await res.json()
    const raw = claudeData.content[0].text as string

    let logged: Record<string, any> | null = null
    try {
      const parsed = JSON.parse(raw)
      if (parsed.food_item && (parsed.confidence === 'high' || parsed.confidence === 'medium')) {
        const db = createClient(SUPABASE_URL, SUPABASE_SVC)
        const { error: insertErr } = await db.from('food_logs').insert({
          log_date:   logDate,
          food_name:  parsed.food_item,
          meal_type:  parsed.meal_type ?? null,
          calories:   Math.round(parsed.kcal ?? 0),
          protein_g:  parsed.protein_g  ?? 0,
          carbs_g:    parsed.carbs_g    ?? 0,
          fat_g:      parsed.fat_g      ?? 0,
          confidence: parsed.confidence,
          raw_input:  msg || null,
          source:     image ? 'image' : 'text',
        })
        if (!insertErr) logged = parsed
      }
    } catch {
      // Invalid JSON from Claude — return null, caller handles gracefully
    }

    return new Response(JSON.stringify({ logged }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
