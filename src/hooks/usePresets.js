import { useState, useEffect, useCallback } from 'react'
import { getFoodPresets } from '../lib/queries'

export function usePresets() {
  const [presets, setPresets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setPresets(await getFoodPresets())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { presets, loading, error, refresh: fetch }
}
