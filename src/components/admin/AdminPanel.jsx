import { useState, useEffect, useRef } from 'react'
import Icon from '../Icon'
import { useAuth } from '../../hooks/useAuth'
import { updateProfile, uploadAvatar } from '../../lib/mutations'
import { prepareImageUpload, ImageValidationError } from '../../lib/imageUpload'
import { TIMEZONE_OPTIONS } from '../../lib/helpers'

const MIN_PASSWORD_LENGTH = 8

const inputCls =
  'w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 font-sans text-[14px] text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/50 transition-colors disabled:opacity-50'

const primaryBtnCls =
  'px-4 py-2 bg-dn-orange text-black font-sans font-semibold text-[13px] uppercase tracking-[0.08em] rounded-sm hover:-translate-y-px transition-all duration-150 disabled:opacity-50 disabled:hover:translate-y-0'

const secondaryBtnCls =
  'px-3 py-2 border border-dn-orange/30 text-dn-orange font-sans text-[13px] rounded-sm hover:bg-dn-orange/10 transition-colors disabled:opacity-50'

function Section({ icon, title, children }) {
  return (
    <section className="py-5 border-b border-white/[0.06] last:border-b-0">
      <div className="flex items-center gap-2 mb-3">
        <Icon name={icon} size={16} className="text-dn-orange" />
        <h3 className="font-sans text-[13px] uppercase tracking-[0.2em] text-dn-gray-light">{title}</h3>
      </div>
      {children}
    </section>
  )
}

// { type: 'ok' | 'error', text } → a one-line result under a form.
function Status({ status }) {
  if (!status) return null
  return (
    <p className={`mt-2 font-sans text-[13px] ${status.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
      {status.text}
    </p>
  )
}

function PasswordSection({ email }) {
  const { updatePassword, sendPasswordReset } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null)
  const [resetStatus, setResetStatus] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus(null)
    if (password.length < MIN_PASSWORD_LENGTH) {
      setStatus({ type: 'error', text: `Use at least ${MIN_PASSWORD_LENGTH} characters.` })
      return
    }
    if (password !== confirm) {
      setStatus({ type: 'error', text: "Passwords don't match." })
      return
    }
    setSaving(true)
    try {
      await updatePassword(password)
      setPassword('')
      setConfirm('')
      setStatus({ type: 'ok', text: 'Password updated.' })
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Could not update password.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    setResetStatus(null)
    setSending(true)
    try {
      await sendPasswordReset(email)
      setResetStatus({ type: 'ok', text: `Reset link sent to ${email}.` })
    } catch (err) {
      setResetStatus({ type: 'error', text: err.message || 'Could not send reset email.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <Section icon="lock" title="Change Password">
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="password"
          autoComplete="new-password"
          placeholder="New password"
          className={inputCls}
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={saving}
        />
        <input
          type="password"
          autoComplete="new-password"
          placeholder="Confirm new password"
          className={inputCls}
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          disabled={saving}
        />
        <button type="submit" disabled={saving || !password || !confirm} className={primaryBtnCls}>
          {saving ? 'Saving…' : 'Update password'}
        </button>
        <Status status={status} />
      </form>

      <div className="mt-4 pt-4 border-t border-white/[0.04]">
        <p className="font-sans text-[13px] text-dn-gray-light mb-2">
          Or get a reset link by email{email ? <> at <span className="text-dn-white">{email}</span></> : null}.
        </p>
        <button type="button" onClick={handleReset} disabled={sending || !email} className={`${secondaryBtnCls} flex items-center gap-1.5`}>
          <Icon name="mail" size={14} />
          {sending ? 'Sending…' : 'Email me a reset link'}
        </button>
        <Status status={resetStatus} />
      </div>
    </Section>
  )
}

function NameSection({ profile, onProfileUpdated }) {
  const [name, setName] = useState(profile?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(() => { setName(profile?.name ?? '') }, [profile?.name])

  const trimmed = name.trim()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!trimmed || trimmed === profile.name) return
    setSaving(true)
    setStatus(null)
    try {
      await updateProfile(profile.id, { name: trimmed })
      onProfileUpdated?.()
      setStatus({ type: 'ok', text: 'Name updated.' })
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Could not update name.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section icon="badge" title="Change Name">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input className={inputCls} value={name} onChange={e => setName(e.target.value)} disabled={saving} maxLength={60} />
        <button type="submit" disabled={saving || !trimmed || trimmed === profile?.name} className={`${primaryBtnCls} shrink-0`}>
          {saving ? '…' : 'Save'}
        </button>
      </form>
      <Status status={status} />
    </Section>
  )
}

function AvatarSection({ profile, onProfileUpdated }) {
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file after an error
    if (!file) return
    setUploading(true)
    setStatus(null)
    try {
      const dataUrl = await prepareImageUpload(file)
      const avatarUrl = await uploadAvatar(dataUrl)
      await updateProfile(profile.id, { avatar_url: avatarUrl })
      onProfileUpdated?.()
      setStatus({ type: 'ok', text: 'Avatar updated.' })
    } catch (err) {
      setStatus({
        type: 'error',
        text: err instanceof ImageValidationError ? err.message : (err.message || 'Could not upload that image.'),
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Section icon="photo_camera" title="Change Avatar">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-sm bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover object-top" />
          ) : (
            <span className="font-display text-[24px] text-dn-gray-light tracking-wider">{profile?.name?.[0] ?? 'M'}</span>
          )}
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className={secondaryBtnCls}>
            {uploading ? 'Uploading…' : 'Upload new photo'}
          </button>
          <p className="mt-1.5 font-sans text-[12px] text-dn-gray-light">JPG, PNG or HEIC, up to 10MB.</p>
        </div>
      </div>
      <Status status={status} />
    </Section>
  )
}

function TimezoneSection({ profile, onProfileUpdated }) {
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)

  async function handleChange(e) {
    setSaving(true)
    setStatus(null)
    try {
      await updateProfile(profile.id, { timezone: e.target.value })
      onProfileUpdated?.()
      setStatus({ type: 'ok', text: 'Timezone updated.' })
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Could not update timezone.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section icon="schedule" title="Change Timezone">
      <select
        value={profile?.timezone ?? 'America/New_York'}
        onChange={handleChange}
        disabled={saving}
        className={inputCls}
      >
        {TIMEZONE_OPTIONS.map(tz => (
          <option key={tz.value} value={tz.value}>{tz.label}</option>
        ))}
      </select>
      <p className="mt-1.5 font-sans text-[12px] text-dn-gray-light">Sets when "today" rolls over on the dashboard and in HekBot.</p>
      <Status status={status} />
    </Section>
  )
}

function MessageCoachSection() {
  return (
    <Section icon="chat" title="Message Coach">
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-sm">
        <span className="font-sans text-[14px] text-dn-gray-light">Send a message straight to your coach.</span>
        <span className="shrink-0 font-sans text-[11px] uppercase tracking-[0.15em] text-dn-orange border border-dn-orange/30 rounded-sm px-2 py-0.5">
          Coming soon
        </span>
      </div>
    </Section>
  )
}

export default function AdminPanel({ open, onClose, profile, email, onProfileUpdated }) {
  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Admin"
        className={`absolute right-0 top-0 h-full w-full max-w-[420px] bg-dn-black border-l border-white/[0.08] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Icon name="person" size={18} className="text-dn-orange" />
            <h2 className="font-display text-[22px] tracking-[0.1em] text-dn-white leading-none">ADMIN</h2>
          </div>
          <button onClick={onClose} aria-label="Close admin panel" className="text-dn-gray-light hover:text-dn-white transition-colors p-1">
            <Icon name="close" size={18} />
          </button>
        </div>

        {open && (
          <div className="flex-1 overflow-y-auto px-5">
            <PasswordSection email={email} />
            {profile && (
              <>
                <NameSection profile={profile} onProfileUpdated={onProfileUpdated} />
                <AvatarSection profile={profile} onProfileUpdated={onProfileUpdated} />
                <TimezoneSection profile={profile} onProfileUpdated={onProfileUpdated} />
              </>
            )}
            <MessageCoachSection />
          </div>
        )}
      </aside>
    </div>
  )
}
