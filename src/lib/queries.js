import { supabase } from '../supabaseClient'

export async function getProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
    .single()
  if (error) throw error
  return data
}

export async function getTargets() {
  const { data, error } = await supabase
    .from('targets')
    .select('*')
    .order('effective_from', { ascending: false })
    .limit(1)
    .single()
  if (error) throw error
  return data
}

export async function getFoodLogsForDate(date) {
  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .eq('log_date', date)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getWorkoutLogsForDate(date) {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('log_date', date)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getFoodLogsForRange(startDate, endDate) {
  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getWorkoutLogsForRange(startDate, endDate) {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getAllCheckins() {
  const { data, error } = await supabase
    .from('weekly_checkins')
    .select('*')
    .order('checkin_date', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getLatestCheckin() {
  const { data, error } = await supabase
    .from('weekly_checkins')
    .select('*')
    .order('checkin_date', { ascending: false })
    .limit(1)
    .single()
  // PGRST116 = no rows found — not a real error for us
  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}
