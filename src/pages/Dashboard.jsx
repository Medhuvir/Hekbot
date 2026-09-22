import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import HekbotPanel from '../components/hekbot/HekbotPanel'
import HeroImageBackdrop from '../components/HeroImageBackdrop'
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
import PublicProfileHero from '../components/profile/PublicProfileHero'
import WeeklySummary from '../components/checkin/WeeklySummary'
import ImportModal from '../components/admin/ImportModal'

import { useFoodLogs, useFoodLogsRange } from '../hooks/useFoodLogs'
import { useWorkoutLogs, useWorkoutLogsRange } from '../hooks/useWorkoutLogs'
import { useCheckins, useLatestCheckin } from '../hooks/useCheckins'
import { useTargets } from '../hooks/useTargets'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'
import { useLiveToday } from '../hooks/useLiveToday'

import { addDays, formatDate, formatDateLong, toLocalISODate, sumMacros, sumCaloriesBurned, buildDailyTotals, computeWeeklySummary } from '../lib/helpers'

const VIEW_DAILY  = 'daily'
const VIEW_WEEKLY = 'weekly'

function getDatesInRange(start, end) {
  const dates = []
  let cur = new Date(start + 'T00:00:00')
  const endD = new Date(end + 'T00:00:00')
  while (cur <= endD) {
    dates.push(toLocalISODate(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

// `mode="app"` is the full, signed-in experience (HekBot + edit tools) —
// this is what AuthGuard protects at /app.
// `mode="public"` is the read-only dashboard anyone can be sent a link to —
// no HekBot, no edit affordances, lives at the unauthenticated root /.
export default function Dashboard({ mode }) {
  const isApp = mode === 'app'
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [view, setView] = useState(VIEW_DAILY)
  const [showImport, setShowImport] = useState(false)

  const { profile, refresh: refreshProfile } = useProfile()
  const timezone = profile?.timezone

  // The real, live calendar date in the profile's timezone — updates on its
  // own if a tab is left open past midnight. `viewDate` is the day currently
  // being browsed; null means "follow today" (so a midnight rollover carries
  // the view forward too).
  const liveToday = useLiveToday(timezone)
  const [viewDate, setViewDate] = useState(null)
  const displayDate    = viewDate ?? liveToday
  const isViewingToday = displayDate === liveToday

  function goToPrevDay() {
    setViewDate(addDays(displayDate, -1))
  }
  function goToNextDay() {
    const next = addDays(displayDate, 1)
    if (next > liveToday) return
    setViewDate(next === liveToday ? null : next)
  }
  function goToToday() {
    setViewDate(null)
  }
  function goToDate(dateStr) {
    if (!dateStr || dateStr > liveToday) return
    setViewDate(dateStr === liveToday ? null : dateStr)
  }

  const { logs: foodLogs,    loading: foodLoading,    refresh: refreshFoodLogs    } = useFoodLogs(displayDate)
  const { logs: workoutLogs, loading: workoutLoading, refresh: refreshWorkoutLogs } = useWorkoutLogs(displayDate)

  // Weekly range data always trails the real live "today" (in the profile's
  // timezone), independent of whichever single day is being browsed above.
  const rangeStart = addDays(liveToday, -13)
  const { logs: foodRange    } = useFoodLogsRange(rangeStart, liveToday)
  const { logs: workoutRange } = useWorkoutLogsRange(rangeStart, liveToday)

  const { checkins, refresh: refreshCheckins } = useCheckins()
  const { checkin: latestCheckin } = useLatestCheckin()
  const { targets } = useTargets()

  const dailyMacros = sumMacros(foodLogs)
  const dailyBurned = sumCaloriesBurned(workoutLogs)
  const netCalories = dailyMacros.calories - dailyBurned

  const dates       = getDatesInRange(rangeStart, liveToday)
  const dailyTotals = buildDailyTotals(foodRange, workoutRange, dates)
  const last7       = dailyTotals.slice(-7)

  const last7Food = foodRange.filter(f => f.log_date >= addDays(liveToday, -6))
  const summary   = computeWeeklySummary(last7Food, checkins.slice(-2), targets)

  const currentDate = formatDateLong(displayDate)
  const nutritionSectionLabel = isViewingToday ? "Today's Nutrition" : `Nutrition — ${formatDate(displayDate)}`

  function handleLogged() {
    refreshFoodLogs()
    refreshWorkoutLogs()
    refreshCheckins()
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative isolate min-h-screen bg-dn-black">
      <HeroImageBackdrop />
      <Header
        isAdmin={isApp}
        currentDate={currentDate}
        onSignOut={handleSignOut}
        isToday={isViewingToday}
        dateInputValue={displayDate}
        maxDate={liveToday}
        onPrevDay={goToPrevDay}
        onNextDay={goToNextDay}
        onToday={goToToday}
        onPickDate={goToDate}
      />

      {isApp
        ? <HekbotPanel onLogged={handleLogged} userName={profile?.name} timezone={timezone} />
        : <PublicProfileHero profile={profile} />
      }

      <PageWrapper>
        {isApp && (
          <div className="mb-6 flex items-center justify-between flex-wrap gap-3 px-4 py-2.5 bg-dn-orange/[0.08] border border-dn-orange/20 rounded-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full bg-dn-orange shrink-0" />
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-[14px] text-dn-orange hover:underline underline-offset-2"
              >
                View public dashboard ↗
              </a>
            </div>
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 px-3 py-1 border border-dn-orange/30 rounded-sm hover:bg-dn-orange/10 transition-colors shrink-0"
            >
              <span className="font-sans text-[13px] text-dn-orange">↑</span>
              <span className="font-sans text-[14px] text-dn-orange tracking-wide">Import MFP</span>
            </button>
          </div>
        )}

        {isApp && showImport && (
          <ImportModal
            onClose={() => setShowImport(false)}
            onImported={() => { refreshFoodLogs(); refreshCheckins() }}
          />
        )}

        {/* Nutrition summary + weight progress — always visible, side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5 sm:mb-7 animate-fade-in-up">
          <MacroTotalsBar totals={dailyMacros} targets={targets} netCalories={netCalories} />
          <JourneyProgress currentWeight={latestCheckin?.weight_lbs} checkins={checkins} />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 mb-5 sm:mb-7 w-fit border border-white/[0.08] rounded-sm p-0.5">
          {[VIEW_DAILY, VIEW_WEEKLY].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-sm font-sans text-[14px] uppercase tracking-[0.1em] transition-all duration-200 ${
                view === v
                  ? 'bg-dn-orange text-black font-semibold'
                  : 'text-dn-gray-light hover:text-dn-white'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {view === VIEW_DAILY && (
          <div className="space-y-4 sm:space-y-6">
            <section>
              <SectionLabel number="01">{nutritionSectionLabel}</SectionLabel>
              <div className="space-y-4">
                <DailyIntakePanel
                  foodLogs={foodLogs}
                  isAdmin={isApp}
                  date={displayDate}
                  onRefresh={refreshFoodLogs}
                  loading={foodLoading}
                  targets={targets}
                />
                <WorkoutLogPanel
                  workoutLogs={workoutLogs}
                  isAdmin={isApp}
                  date={displayDate}
                  onRefresh={refreshWorkoutLogs}
                  loading={workoutLoading}
                />
              </div>
            </section>

            <section>
              <SectionLabel number="02">Weekly Summary</SectionLabel>
              <WeeklySummary summary={summary} isAdmin={isApp} onRefresh={refreshCheckins} />
            </section>

            <section>
              <SectionLabel number="03">Profile</SectionLabel>
              <ProfilePanel
                profile={profile}
                latestCheckin={latestCheckin}
                workoutLogs={workoutRange}
                isAdmin={isApp}
                onProfileUpdated={refreshProfile}
              />
            </section>
          </div>
        )}

        {view === VIEW_WEEKLY && (
          <div className="space-y-4 sm:space-y-6">
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
              <SectionLabel number="04">Weekly Summary</SectionLabel>
              <WeeklySummary summary={summary} isAdmin={isApp} onRefresh={refreshCheckins} />
            </section>
          </div>
        )}
      </PageWrapper>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] mt-10 sm:mt-16 py-5 sm:py-6 px-4 sm:px-6">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="font-sans text-[12px] text-dn-gray-light tracking-[0.1em]">
            {isApp ? 'Ascension' : 'Ascension · Personal · Read-only view'}
          </div>
          <div className="font-sans text-[12px] text-dn-gray-light/40">DN Creative LLC</div>
        </div>
      </footer>
    </div>
  )
}
