import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import DNMark from '../components/DNMark'
import Icon from '../components/Icon'
import LiveTopo from '../components/LiveTopo'
import { OVERLAYS } from '../lib/tokens'

export default function Login() {
  const { signIn, sendPasswordReset, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState(null)

  if (isAuthenticated) {
    navigate('/app', { replace: true })
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signIn(email, password)
      navigate('/app', { replace: true })
    } catch (e) {
      setError('Incorrect email or password.')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword() {
    setError(null)
    setResetMessage(null)
    if (!email) {
      setError('Enter your email above first.')
      return
    }
    try {
      await sendPasswordReset(email)
      setResetMessage(`If ${email} has an account, a reset link is on its way.`)
    } catch (e) {
      setError(e.message || 'Could not send reset email.')
    }
  }

  return (
    <div className="min-h-screen bg-dn-black flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <LiveTopo overlay={OVERLAYS.form} />

      <div className="relative w-full max-w-sm">
        {/* DN Lockup */}
        <div className="flex flex-col items-center mb-10">
          <DNMark size={40} variant="white" />
          <div className="font-display text-display-md tracking-display text-dn-white mt-4 leading-none">
            HekBot
          </div>
          <div className="font-sans text-caption tracking-label uppercase text-dn-gray-light mt-1">
            Sign in
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="font-sans text-caption uppercase tracking-label text-dn-gray-light block mb-1.5">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              className="w-full bg-dn-fill border border-dn-line rounded-sm px-4 py-2.5 font-sans text-body text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/60 transition-colors"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="font-sans text-caption uppercase tracking-label text-dn-gray-light block mb-1.5">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              required
              className="w-full bg-dn-fill border border-dn-line rounded-sm px-4 py-2.5 font-sans text-body text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/60 transition-colors"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="font-sans text-caption text-dn-danger pt-1">{error}</p>
          )}
          {resetMessage && (
            <p className="font-sans text-caption text-dn-success pt-1">{resetMessage}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary py-3 w-full mt-2"
          >
            {loading ? 'Signing in…' : 'Enter'}
          </button>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="w-full pt-1 font-sans text-body text-dn-gray-light hover:text-dn-white transition-colors"
          >
            Forgot password?
          </button>
        </form>

        <div className="mt-8 text-center">
          <a href="/" className="font-sans text-body text-dn-gray-light hover:text-dn-white transition-colors">
            <Icon name="arrow_back" size={11} className="align-[-1px]" /> Public dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
