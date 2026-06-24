import { useState, useEffect, useCallback } from 'react'
import { getAllCheckins, getLatestCheckin } from '../lib/queries'

export function useCheckins() {
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCheckins(await getAllCheckins())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { checkins, loading, error, refresh: fetch }
}

export function useLatestCheckin() {
  const [checkin, setCheckin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLatestCheckin()
      .then(setCheckin)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { checkin, loading }
}
