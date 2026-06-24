import { supabase } from '../supabaseClient'

// ─── Food Logs ─────────────────────────────────────────────────────────────

export async function bulkAddFoodLogs(entries) {
  // entries: array of { log_date, food_name, calories, protein_g, carbs_g, fat_g }
  const { data, error } = await supabase
    .from('food_logs')
    .insert(entries)
    .select()
  if (error) throw error
  return data
}

export async function addFoodLog({ log_date, food_name, calories, protein_g, carbs_g, fat_g, notes }) {
  const { data, error } = await supabase
    .from('food_logs')
    .insert([{ log_date, food_name, calories, protein_g, carbs_g, fat_g, notes }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateFoodLog(id, updates) {
  const { data, error } = await supabase
    .from('food_logs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteFoodLog(id) {
  const { error } = await supabase.from('food_logs').delete().eq('id', id)
  if (error) throw error
}

// ─── Workout Logs ───────────────────────────────────────────────────────────

export async function addWorkoutLog({ log_date, workout_type, workout_name, duration_min, calories_burned, notes }) {
  const { data, error } = await supabase
    .from('workout_logs')
    .insert([{ log_date, workout_type, workout_name, duration_min, calories_burned, notes }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateWorkoutLog(id, updates) {
  const { data, error } = await supabase
    .from('workout_logs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteWorkoutLog(id) {
  const { error } = await supabase.from('workout_logs').delete().eq('id', id)
  if (error) throw error
}

// ─── Weekly Check-ins ───────────────────────────────────────────────────────

export async function addCheckin({ checkin_date, weight_lbs, waist_cm, notes }) {
  // Do NOT include weight_kg — it's a generated column computed by Postgres
  const { data, error } = await supabase
    .from('weekly_checkins')
    .insert([{ checkin_date, weight_lbs, waist_cm, notes }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCheckin(id, { weight_lbs, waist_cm, notes }) {
  const { data, error } = await supabase
    .from('weekly_checkins')
    .update({ weight_lbs, waist_cm, notes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Profile ────────────────────────────────────────────────────────────────

export async function updateProfile(id, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Targets ────────────────────────────────────────────────────────────────

export async function updateTargets(id, updates) {
  const { data, error } = await supabase
    .from('targets')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
