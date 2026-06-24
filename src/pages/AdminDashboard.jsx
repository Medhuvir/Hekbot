import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import PageWrapper from '../components/layout/PageWrapper'
import SectionLabel from '../components/layout/SectionLabel'
import JourneyProgress from '../components/charts/JourneyProgress'
import WeightTrendChart from '../components/charts/WeightTrendChart'
import MacroAdherenceChart from '../components/charts/MacroAdherenceChart'
import CalorieTrendChart from '../components/charts/CalorieTrendChart'
import DailyIntakePanel from '../components/tracker/DailyIntakePanel'
import WorkoutLogPanel from '../components/tracker/WorkoutLogPanel'
import MacroTotalsBar from '../components/tracker/MacroTotalsBar'
import ProfilePanel from '../components/profile/ProfilePanel'
import WeeklySummary from '../components/checkin/WeeklySummary'

import { useFoodLogs, useFoodLogsRange } from '../hooks/useFoodLogs'
import { useWorkoutLogs, useWorkoutLogsRange } from '../hooks/useWorkoutLogs'
import { useCheckins, useLatestCheckin } from '../hooks/useCheckins'
import { useTargets } from '../hooks/useTargets'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'
import ImportModal from '../components/admin/ImportModal'

import { today, nDaysAgo, formatDateLong, sumMacros, sumCaloriesBurned, buildDailyTotals, computeWeeklySummary } from '../lib/helpers'

const VIEW_DAILY  = 'daily'
const VIEW_WEEKLY = 'weekly'

function getDatesInRange(start, end) {
  const dates = []
  let cur = new Date(start + 'T00:00:00')
  const endD = new Date(end + 'T00:00:00')
  while (cur <= endD) {
    dates.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

export default function AdminDashboard() {
  const { signOut } = useAuth()
  const navigate    = useNavigate()
  const [view, setView]           = useState(VIEW_DAILY)
  const [showImport, setShowImport] = useState(false)
  const todayStr = today()

  const { logs: foodLogs, loading: foodLoading, refresh: refreshFood } = useFoodLogs(todayStr)
  const { logs: workoutLogs, loading: workoutLoading, refresh: refreshWorkout } = useWorkoutLogs(todayStr)

  const rangeStart = nDaysAgo(13)
  const { logs: foodRange }    = useFoodLogsRange(rangeStart, todayStr)
  const { logs: workoutRange } = useWorkoutLogsRange(rangeStart, todayStr)

  const { checkins, refresh: refreshCheckins } = useCheckins()
  const { checkin: latestCheckin } = useLatestCheckin()
  const { targets } = useTargets()
  const { profile } = useProfile()

  const dailyMacros = sumMacros(foodLogs)
  const dailyBurned = sumCaloriesBurned(workoutLogs)
  const netCalories = dailyMacros.calories - dailyBurned

  const dates       = getDatesInRange(rangeStart, todayStr)
  const dailyTotals = buildDailyTotals(foodRange, workoutRange, dates)
  const last7       = dailyTotals.slice(-7)

  const last7Food = foodRange.filter(f => f.log_date >= nDaysAgo(6))
  const summary   = computeWeeklySummary(last7Food, checkins.slice(-2), targets)

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  const currentDate = formatDateLong(todayStr)

  return (
    <div className="min-h-screen bg-dn-black">
      <Header isAdmin currentDate={currentDate} onSignOut={handleSignOut} />

      <PageWrapper>
        {/* Admin banner */}
        <div className="mb-6 flex items-center justify-between px-4 py-2.5 bg-dn-orange/[0.08] border border-dn-orange/20 rounded-sm">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-dn-orange" />
            <span className="font-sans text-[11px] text-dn-orange">
              Admin mode — all edit controls are active
            </span>
          </div>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-3 py-1 border border-dn-orange/30 rounded-sm hover:bg-dn-orange/10 transition-colors"
          >
            <span className="font-sans text-[10px] text-dn-orange">↑</span>
            <span className="font-sans text-[11px] text-dn-orange tracking-wide">Import MFP</span>
          </button>
        </div>

        {/* Import modal */}
        {showImport && (
          <ImportModal
            onClose={() => setShowImport(false)}
            onImported={() => { refreshFood(); refreshCheckins() }}
          />
        )}

        {/* View toggle */}
        <div className="flex items-center gap-1 mb-7 w-fit border border-white/[0.08] rounded-sm p-0.5">
          {[VIEW_DAILY, VIEW_WEEKLY].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-sm font-sans text-[11px] uppercase tracking-[0.1em] transition-all duration-200 ${
                view === v
                  ? 'bg-dn-orange text-black font-semibold'
                  : 'text-dn-graphite hover:text-dn-white'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Journey progress */}
        <div className="mb-6">
          <JourneyProgress currentWeight={latestCheckin?.weight_lbs} />
        </div>

        {view === VIEW_DAILY && (
          <div className="space-y-6">
            <section>
              <SectionLabel number="01">Today's Nutrition</SectionLabel>
              <div className="space-y-4">
                <MacroTotalsBar totals={dailyMacros} targets={targets} netCalories={netCalories} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <DailyIntakePanel
                    foodLogs={foodLogs}
                    isAdmin={true}
                    date={todayStr}
                    onRefresh={refreshFood}
                    loading={foodLoading}
                  />
                  <WorkoutLogPanel
                    workoutLogs={workoutLogs}
                    isAdmin={true}
                    date={todayStr}
                    onRefresh={refreshWorkout}
                    loading={workoutLoading}
                  />
                </div>
              </div>
            </section>

            <section>
              <SectionLabel number="02">Weekly Check-in</SectionLabel>
              <WeeklySummary summary={summary} isAdmin={true} onRefresh={refreshCheckins} />
            </section>

            <section>
              <SectionLabel number="03">Profile</SectionLabel>
              <ProfilePanel profile={profile} latestCheckin={latestCheckin} />
            </section>
          </div>
        )}

        {view === VIEW_WEEKLY && (
          <div className="space-y-6">
            <section>
              <SectionLabel number="01">Weight Trend</SectionLabel>
              <WeightTrendChart checkins={checkins} />
            </section>

            <section>
              <SectionLabel number="02">Calorie Trend — Last 14 Days</SectionLabel>
              <CalorieTrendChart dailyTotals={dailyTotals} targets={targets} />
            </section>

            <section>
              <SectionLabel number="03">Macro Adherence</SectionLabel>
              <MacroAdherenceChart dailyTotals={last7} targets={targets} />
            </section>

            <section>
              <SectionLabel number="04">Weekly Check-in History</SectionLabel>
              <WeeklySummary summary={summary} isAdmin={true} onRefresh={refreshCheckins} />
            </section>
          </div>
        )}
      </PageWrapper>

      <footer className="border-t border-white/[0.06] mt-16 py-6 px-6">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="font-sans text-[9px] text-dn-graphite tracking-[0.1em]">
            Ascension · Admin Portal
          </div>
          <div className="font-sans text-[9px] text-dn-graphite/40">DN Creative LLC</div>
        </div>
      </footer>
    </div>
  )
}
