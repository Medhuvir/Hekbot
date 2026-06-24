import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function AuthGuard({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-dn-black flex items-center justify-center">
        <div className="font-display text-[22px] tracking-[0.15em] text-dn-graphite animate-pulse">
          ASCENSION
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}
