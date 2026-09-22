import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SVC  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_ANON = Deno.env.get('SUPABASE_ANON_KEY')!

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This function writes via the service-role key (bypassing RLS), which makes
// this check the only thing standing between "anyone with the public anon
// key" and this app's data. `verify_jwt` alone doesn't help — the anon key
// IS a valid JWT. This confirms the caller's bearer token resolves to a real
// signed-in user.
async function requireAuthenticatedUser(req: Request): Promise<{ id: string } | null> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return null
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON)
  const { data, error } = await authClient.auth.getUser(token)
  if (error || !data.user) return null
  return { id: data.user.id }
}

// ── DB writes for confirmed food/body/workout entries ─────────────────
async function insertFoodItem(
  db: any,
  item: { food_item: string; kcal?: number; protein_g?: number; carbs_g?: number; fat_g?: number; meal_type?: string | null; confidence?: string },
  logDate: string,
  rawInput: string,
  source: 'text' | 'image' | 'preset',
): Promise<boolean> {
  const coreRow = {
    log_date:  logDate,
    food_name: item.food_item,
    calories:  Math.round(item.kcal ?? 0),
    protein_g: Number((item.protein_g ?? 0).toFixed(1)),
    carbs_g:   Number((item.carbs_g   ?? 0).toFixed(1)),
    fat_g:     Number((item.fat_g     ?? 0).toFixed(1)),
  }
  const { error: extErr } = await db.from('food_logs').insert({
    ...coreRow, meal_type: item.meal_type ?? null, confidence: item.confidence ?? null, raw_input: rawInput, source,
  })
  if (extErr) {
    console.warn('[log-commit] food extended insert failed, trying core:', extErr.message)
    const { error: coreErr } = await db.from('food_logs').insert(coreRow)
    if (coreErr) {
      console.error('[log-commit] food core insert failed:', coreErr.message)
      return false
    }
  }
  return true
}

async function upsertBodyEntry(
  db: any,
  body: { weight_lbs?: number | null; waist_cm?: number | null },
  logDate: string,
): Promise<boolean> {
  if (body.weight_lbs == null && body.waist_cm == null) return false
  const row: Record<string, any> = { checkin_date: logDate }
  if (body.weight_lbs != null) row.weight_lbs = Number(body.weight_lbs)
  if (body.waist_cm   != null) row.waist_cm   = Number(body.waist_cm)

  const { error } = await db.from('weekly_checkins').upsert(row, { onConflict: 'checkin_date' })
  if (error) {
    console.error('[log-commit] body upsert failed:', error.message)
    return false
  }
  return true
}

async function insertWorkoutEntry(
  db: any,
  workout: { workout_type?: string; workout_name?: string | null; duration_min?: number | null; calories_burned?: number | null },
  logDate: string,
): Promise<boolean> {
  if (!workout.workout_type) return false
  const row: Record<string, any> = {
    log_date:     logDate,
    workout_type: workout.workout_type,
  }
  if (workout.workout_name)    row.workout_name    = workout.workout_name
  if (workout.duration_min)    row.duration_min    = Number(workout.duration_min)
  if (workout.calories_burned) row.calories_burned = Number(workout.calories_burned)

  const { error } = await db.from('workout_logs').insert(row)
  if (error) {
    console.error('[log-commit] workout insert failed:', error.message)
    return false
  }
  return true
}

// Commits a user-reviewed (and possibly edited) extraction from /chat, or a
// tapped preset, to the DB. Nothing from /chat is ever written before this runs.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  const user = await requireAuthenticatedUser(req)
  if (!user) {
    return new Response(JSON.stringify({ error: 'Sign in required.' }), {
      status: 401,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json()
    const logDate  = body.log_date ?? new Date().toISOString().split('T')[0]
    const source   = body.source === 'image' ? 'image' : 'text'
    const rawInput = body.raw_input ?? ''

    const db = createClient(SUPABASE_URL, SUPABASE_SVC)

    const loggedFood: Record<string, any>[] = []
    let   loggedWeight:  Record<string, any> | null = null
    let   loggedWorkout: Record<string, any> | null = null

    for (const item of (body.food_items ?? [])) {
      if (!item.food_item) continue
      const ok = await insertFoodItem(db, item, logDate, rawInput, source)
      if (ok) loggedFood.push(item)
    }

    for (const p of (body.presets ?? [])) {
      const { data: preset, error: presetErr } = await db
        .from('food_presets')
        .select('*')
        .eq('id', p.preset_id)
        .single()
      if (presetErr || !preset) {
        console.error('[log-commit] preset lookup failed:', p.preset_id, presetErr?.message)
        continue
      }
      const item = {
        food_item: preset.name,
        kcal:      preset.calories,
        protein_g: preset.protein_g,
        carbs_g:   preset.carbs_g,
        fat_g:     preset.fat_g,
        meal_type: preset.meal_type,
      }
      const ok = await insertFoodItem(db, item, logDate, `preset: ${preset.name}`, 'preset')
      if (ok) loggedFood.push(item)
    }

    if (body.body_entry) {
      const ok = await upsertBodyEntry(db, body.body_entry, logDate)
      if (ok) loggedWeight = body.body_entry
    }

    if (body.workout_entry) {
      const ok = await insertWorkoutEntry(db, body.workout_entry, logDate)
      if (ok) loggedWorkout = body.workout_entry
    }

    // Bookmark any confirmed food items as reusable presets
    for (const save of (body.save_as_preset ?? [])) {
      const item = (body.food_items ?? [])[save.food_item_index]
      if (!item) continue
      const { error: presetInsertErr } = await db.from('food_presets').insert({
        name:      save.name ?? item.food_item,
        meal_type: item.meal_type ?? null,
        calories:  Math.round(item.kcal ?? 0),
        protein_g: Number((item.protein_g ?? 0).toFixed(1)),
        carbs_g:   Number((item.carbs_g   ?? 0).toFixed(1)),
        fat_g:     Number((item.fat_g     ?? 0).toFixed(1)),
      })
      if (presetInsertErr) console.error('[log-commit] preset save failed:', presetInsertErr.message)
    }

    return new Response(
      JSON.stringify({
        logged: {
          food:    loggedFood.length > 0 ? loggedFood : null,
          weight:  loggedWeight,
          workout: loggedWorkout,
        },
      }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    console.error('[log-commit] unhandled error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
