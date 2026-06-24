import { useState, useEffect, useCallback } from 'react'
import { getWorkoutLogsForDate, getWorkoutLogsForRange } from '../lib/queries'

export function useWorkoutLogs(date) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!date) return
    setLoading(true)
    setError(null)
    try {
      setLogs(await getWorkoutLogsForDate(date))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { fetch() }, [fetch])

  return { logs, loading, error, refresh: fetch }
}

export function useWorkoutLogsRange(startDate, endDate) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!startDate || !endDate) return
    setLoading(true)
    getWorkoutLogsForRange(startDate, endDate)
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [startDate, endDate])

  return { logs, loading }
}
