// ─── Date utilities ─────────────────────────────────────────────────────────

export function today() {
  return new Date().toISOString().split('T')[0]
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatDateLong(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function nDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

// ─── Unit conversion ─────────────────────────────────────────────────────────

export function lbsToKg(lbs) {
  return parseFloat((lbs / 2.20462).toFixed(1))
}

export function kgToLbs(kg) {
  return parseFloat((kg * 2.20462).toFixed(1))
}

// ─── Macro aggregation ───────────────────────────────────────────────────────

export function sumMacros(foodLogs) {
  return foodLogs.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein_g: acc.protein_g + parseFloat(item.protein_g || 0),
      carbs_g: acc.carbs_g + parseFloat(item.carbs_g || 0),
      fat_g: acc.fat_g + parseFloat(item.fat_g || 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  )
}

export function sumCaloriesBurned(workoutLogs) {
  return workoutLogs.reduce((acc, w) => acc + (w.calories_burned || 0), 0)
}

// Returns { calStatus, proteinStatus } — 'on-track' | 'under' | 'over'
export function getMacroStatus(totals, targets) {
  if (!targets) return { calStatus: 'on-track', proteinStatus: 'on-track' }

  const calStatus =
    totals.calories > targets.calories_max ? 'over' :
    totals.calories > 0 && totals.calories < targets.calories_min ? 'under' :
    'on-track'

  const proteinStatus =
    totals.protein_g > 0 && totals.protein_g < 160 ? 'under' : 'on-track'

  return { calStatus, proteinStatus }
}

// ─── Progress toward goal milestones ─────────────────────────────────────────

const START_WEIGHT = 211
const PHASE1_GOAL  = 200
const PHASE2_GOAL  = 190

export function getPhaseProgress(currentWeight) {
  if (!currentWeight) return { phase: 1, pct: 0, label: 'Phase I — Break 200', goalLabel: 'Break 200', current: START_WEIGHT }

  if (currentWeight <= PHASE2_GOAL) {
    return { phase: 2, pct: 100, label: 'Ascension Complete', goalLabel: 'Strike 190', current: currentWeight }
  }

  if (currentWeight <= PHASE1_GOAL) {
    const pct = Math.min(100, Math.round(((PHASE1_GOAL - currentWeight) / (PHASE1_GOAL - PHASE2_GOAL)) * 100))
    return { phase: 2, pct, label: 'Phase II — Strike 190', goalLabel: 'Strike 190', current: currentWeight }
  }

  const pct = Math.min(100, Math.round(((START_WEIGHT - currentWeight) / (START_WEIGHT - PHASE1_GOAL)) * 100))
  return { phase: 1, pct, label: 'Phase I — Break 200', goalLabel: 'Break 200', current: currentWeight }
}

// ─── Daily data aggregation for charts ───────────────────────────────────────

// Groups food_logs and workout_logs by date into chart-ready format
export function buildDailyTotals(foodLogs, workoutLogs, dates) {
  return dates.map(date => {
    const dayFood    = foodLogs.filter(f => f.log_date === date)
    const dayWorkout = workoutLogs.filter(w => w.log_date === date)
    const macros     = sumMacros(dayFood)
    const burned     = sumCaloriesBurned(dayWorkout)

    return {
      date,
      label: formatDate(date),
      calories: macros.calories,
      protein_g: parseFloat(macros.protein_g.toFixed(1)),
      carbs_g: parseFloat(macros.carbs_g.toFixed(1)),
      fat_g: parseFloat(macros.fat_g.toFixed(1)),
      burned,
      net: macros.calories - burned,
    }
  })
}

// ─── Weekly summary ───────────────────────────────────────────────────────────

export function computeWeeklySummary(foodLogs, checkins, targets) {
  const days = [...new Set(foodLogs.map(f => f.log_date))]
  if (!days.length && !checkins.length) return null

  const avgCalories = days.length
    ? Math.round(foodLogs.reduce((s, f) => s + (f.calories || 0), 0) / days.length)
    : 0

  const proteinTarget = targets?.protein_g ?? 180
  const daysWithProtein = days.filter(d => {
    const total = foodLogs
      .filter(f => f.log_date === d)
      .reduce((s, f) => s + parseFloat(f.protein_g || 0), 0)
    return total >= proteinTarget
  })
  const proteinAdherence = days.length
    ? Math.round((daysWithProtein.length / days.length) * 100)
    : 0

  const sorted  = [...checkins].sort((a, b) => new Date(a.checkin_date) - new Date(b.checkin_date))
  const latest  = sorted[sorted.length - 1] ?? null
  const prev    = sorted[sorted.length - 2] ?? null

  const weightDelta = latest && prev
    ? parseFloat((latest.weight_lbs - prev.weight_lbs).toFixed(1))
    : null

  const waistDelta = latest && prev && latest.waist_cm && prev.waist_cm
    ? parseFloat((latest.waist_cm - prev.waist_cm).toFixed(1))
    : null

  let trend = 'On Track'
  if (weightDelta !== null) {
    if (weightDelta > 0)    trend = 'Needs Adjustment'
    else if (weightDelta <= -1.5) trend = 'Ahead of Pace'
  }

  return { avgCalories, proteinAdherence, weightDelta, waistDelta, trend, latest }
}

// ─── Linear projection for weight trend ──────────────────────────────────────

export function projectWeightTrend(checkins, daysAhead = 56) {
  if (checkins.length < 2) return []

  const sorted = [...checkins].sort((a, b) => new Date(a.checkin_date) - new Date(b.checkin_date))
  const last3  = sorted.slice(-3)

  // Least-squares linear regression over last 3 check-ins
  const xs = last3.map((_, i) => i)
  const ys = last3.map(c => c.weight_lbs)
  const n  = xs.length
  const sumX  = xs.reduce((a, b) => a + b, 0)
  const sumY  = ys.reduce((a, b) => a + b, 0)
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0)
  const sumX2 = xs.reduce((s, x) => s + x * x, 0)
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  const lastDate   = new Date(sorted[sorted.length - 1].checkin_date + 'T00:00:00')
  const firstDate  = new Date(last3[0].checkin_date + 'T00:00:00')
  const daySpan    = (lastDate - firstDate) / (86400000 * (last3.length - 1))
  const slopePerDay = slope / (daySpan || 7)

  const projections = []
  for (let i = 7; i <= daysAhead; i += 7) {
    const d = new Date(lastDate)
    d.setDate(d.getDate() + i)
    const projected = parseFloat((sorted[sorted.length - 1].weight_lbs + slopePerDay * i).toFixed(1))
    projections.push({
      date: d.toISOString().split('T')[0],
      label: formatDate(d.toISOString().split('T')[0]),
      projected,
    })
  }
  return projections
}
