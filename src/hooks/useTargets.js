import { useState, useEffect, useCallback } from 'react'
import { getTargets } from '../lib/queries'

export function useTargets() {
  const [targets, setTargets] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    return getTargets()
      .then(setTargets)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { targets, loading, refresh }
}
