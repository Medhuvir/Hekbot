import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import DNMark from '../components/DNMark'
import Icon from '../components/Icon'
import LiveTopo from '../components/LiveTopo'

const MIN_PASSWORD_LENGTH = 8

const inputCls =
  'w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-4 py-2.5 font-sans text-[16px] text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/50 transition-colors'

// Landing page for the password-reset email link. Supabase turns the link's
// token into a (recovery) session on load, so by the time the form submits
// updatePassword() acts on the right account.
export default function ResetPassword() {
  const { session, loading: authLoading, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (password.length < MIN_PASSWORD_LENGTH) return setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`)
    if (password !== confirm) return setError("Passwords don't match.")
    setSaving(true)
    try {
      await updatePassword(password)
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err.message || 'Could not update password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-dn-black flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <LiveTopo overlay="radial-gradient(ellipse at center, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.6) 45%, rgba(10,10,10,0.1) 100%)" />

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <DNMark size={40} variant="white" />
          <div className="font-display text-[32px] tracking-[0.08em] text-dn-white mt-4 leading-none">
            HekBot
          </div>
          <div className="font-sans text-[15px] tracking-[0.2em] uppercase text-dn-gray-light mt-1">
            Set a new password
          </div>
        </div>

        {authLoading ? null : !session ? (
          <div className="text-center space-y-4">
            <p className="font-sans text-[16px] text-dn-gray-light">
              This reset link is invalid or has expired. Request a new one from the Admin panel, or from the sign-in page.
            </p>
            <a href="/login" className="inline-block font-sans text-[16px] text-dn-orange hover:underline underline-offset-2">
              Go to sign in
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              autoComplete="new-password"
              required
              placeholder="New password"
              className={inputCls}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <input
              type="password"
              autoComplete="new-password"
              required
              placeholder="Confirm new password"
              className={inputCls}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
            {error && <p className="font-sans text-[14px] text-red-400 pt-1">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full mt-2 py-3 bg-dn-orange text-black font-sans font-semibold text-[15px] tracking-[0.08em] uppercase rounded-sm hover:-translate-y-px transition-all duration-150 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save password'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <a href="/" className="font-sans text-[16px] text-dn-gray-light hover:text-dn-white transition-colors">
            <Icon name="arrow_back" size={11} className="align-[-1px]" /> Public dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
