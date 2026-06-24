import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import DNMark from '../components/DNMark'
import TopoBackground from '../components/TopoBackground'

export default function AdminLogin() {
  const { signIn, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    navigate('/admin', { replace: true })
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signIn(email, password)
      navigate('/admin', { replace: true })
    } catch (e) {
      setError('Incorrect email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dn-black flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <TopoBackground opacity={0.07} />

      <div className="relative w-full max-w-sm">
        {/* DN Lockup */}
        <div className="flex flex-col items-center mb-10">
          <DNMark size={40} variant="white" />
          <div className="font-display text-[32px] tracking-[0.08em] text-dn-white mt-4 leading-none">
            Ascension
          </div>
          <div className="font-sans text-[10px] tracking-[0.2em] uppercase text-dn-graphite mt-1">
            Admin Portal
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="font-sans text-[10px] uppercase tracking-[0.15em] text-dn-graphite block mb-1.5">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-4 py-2.5 font-sans text-[14px] text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/50 transition-colors"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="font-sans text-[10px] uppercase tracking-[0.15em] text-dn-graphite block mb-1.5">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              required
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-4 py-2.5 font-sans text-[14px] text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/50 transition-colors"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="font-sans text-[12px] text-red-400 pt-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-dn-orange text-black font-sans font-semibold text-[13px] tracking-[0.08em] uppercase rounded-sm hover:-translate-y-px transition-all duration-150 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Enter'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <a href="/" className="font-sans text-[11px] text-dn-graphite hover:text-dn-white transition-colors">
            ← Public dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
