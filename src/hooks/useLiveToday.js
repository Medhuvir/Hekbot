import { useState, useEffect } from 'react'
import { today } from '../lib/helpers'

// Re-renders consumers when the local calendar day rolls over — e.g. a tab
// left open past midnight — without needing a page reload.
//
// A plain setInterval isn't enough on its own: browsers throttle (or fully
// suspend) timers in backgrounded/inactive tabs, so a tab left open
// overnight can sit on yesterday's date well past when the poll "should"
// have fired. Recomputing on visibilitychange/focus catches up immediately
// the moment the tab is looked at again, regardless of how long it was
// backgrounded or how throttled the interval was.
export function useLiveToday() {
  const [date, setDate] = useState(today())

  useEffect(() => {
    function sync() {
      const now = today()
      setDate(prev => (prev === now ? prev : now))
    }

    const id = setInterval(sync, 30_000)
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('focus', sync)
    sync() // catch up immediately in case this mount itself follows a long background stretch

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('focus', sync)
    }
  }, [])

  return date
}
