import { useState, useEffect } from 'react'
import { today } from '../lib/helpers'

// Re-renders consumers when the local calendar day rolls over — e.g. a tab
// left open past midnight — without needing a page reload. A light polling
// interval is enough here; a date string only needs to update within a
// minute of the actual rollover, not to the second.
export function useLiveToday() {
  const [date, setDate] = useState(today())

  useEffect(() => {
    const id = setInterval(() => {
      const now = today()
      setDate(prev => (prev === now ? prev : now))
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  return date
}
