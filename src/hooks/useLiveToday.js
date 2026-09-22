import { useState, useEffect } from 'react'
import { todayInTZ } from '../lib/helpers'

// Re-renders consumers when the calendar day rolls over in `timezone` — e.g.
// a tab left open past midnight — without needing a page reload. `timezone`
// should be the profile's IANA zone (e.g. 'America/New_York'); pass
// undefined while the profile is still loading and it falls back to the
// browser's own local date until the real timezone is known.
//
// A plain setInterval isn't enough on its own: browsers throttle (or fully
// suspend) timers in backgrounded/inactive tabs, so a tab left open
// overnight can sit on yesterday's date well past when the poll "should"
// have fired. Recomputing on visibilitychange/focus catches up immediately
// the moment the tab is looked at again, regardless of how long it was
// backgrounded or how throttled the interval was.
export function useLiveToday(timezone) {
  const [date, setDate] = useState(() => todayInTZ(timezone))

  useEffect(() => {
    function sync() {
      const now = todayInTZ(timezone)
      setDate(prev => (prev === now ? prev : now))
    }

    const id = setInterval(sync, 30_000)
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('focus', sync)
    sync() // catch up immediately — covers both a long background stretch and `timezone` becoming known after the profile loads

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('focus', sync)
    }
  }, [timezone])

  return date
}
