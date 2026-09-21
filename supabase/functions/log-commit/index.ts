import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { insertFoodItem, upsertBodyEntry, insertWorkoutEntry } from '../_shared/logInserts.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SVC = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Commits a user-reviewed (and possibly edited) extraction from /chat, or a
// tapped preset, to the DB. Nothing from /chat is ever written before this runs.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
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
