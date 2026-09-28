import { useState, useEffect, useCallback } from 'react'
import { getTargets } from '../lib/queries'

export function useTargets() {
  const [targets, setTargets] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      setTargets(await getTargets())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { targets, loading, refresh: fetch }
}
