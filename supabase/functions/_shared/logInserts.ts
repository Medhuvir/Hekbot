// Shared by the chat and log-commit Edge Functions — the actual DB writes for
// confirmed food/body/workout entries. `chat` only extracts; this is what commits.

export async function insertFoodItem(
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
    console.warn('[logInserts] food extended insert failed, trying core:', extErr.message)
    const { error: coreErr } = await db.from('food_logs').insert(coreRow)
    if (coreErr) {
      console.error('[logInserts] food core insert failed:', coreErr.message)
      return false
    }
  }
  return true
}

export async function upsertBodyEntry(
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
    console.error('[logInserts] body upsert failed:', error.message)
    return false
  }
  return true
}

export async function insertWorkoutEntry(
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
    console.error('[logInserts] workout insert failed:', error.message)
    return false
  }
  return true
}
