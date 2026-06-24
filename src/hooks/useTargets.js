import { useState, useEffect } from 'react'
import { getTargets } from '../lib/queries'

export function useTargets() {
  const [targets, setTargets] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTargets()
      .then(setTargets)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { targets, loading }
}
