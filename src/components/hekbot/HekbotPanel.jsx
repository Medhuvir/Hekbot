import { useState, useRef, useEffect } from 'react'
import DotGridWave from '../DotGridWave'
import Icon from '../Icon'
import HekbotReview from './HekbotReview'
import { usePresets } from '../../hooks/usePresets'
import { prepareImageUpload, ImageValidationError } from '../../lib/imageUpload'

const MEAL_PHOTO_PROMPT = 'Extract macros from this meal'
const QUICK_ACTIONS = ['Daily summary', 'Weekly summary', 'Log weight', 'Log waist']
const SUGGESTIONS = [
  { label: 'Log a meal', icon: 'restaurant' },
  { label: 'Log a workout', icon: 'fitness_center' },
  { label: "How am I doing this week?", icon: 'insights' },
  { label: 'Set a new target', icon: 'flag' },
]

const HELPER_PREFIX = 'Tell HekBot what you ate. '
const HELPER_ROTATIONS = ['Did you train?', 'How long was it?', 'How do your joints feel?']

// Cycles `rotations` through a slow type → pause → delete → next loop, one
// character at a time. `prefix` is rendered ahead of it and never animates.
function useTypewriterSuffix(rotations, { typeSpeed = 55, deleteSpeed = 32, holdMs = 1800, gapMs = 400 } = {}) {
  const [suffix, setSuffix] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [phase, setPhase] = useState('typing')

  useEffect(() => {
    const current = rotations[phraseIndex % rotations.length]
    let timeout

    if (phase === 'typing') {
      if (suffix.length < current.length) {
        timeout = setTimeout(() => setSuffix(current.slice(0, suffix.length + 1)), typeSpeed)
      } else {
        timeout = setTimeout(() => setPhase('deleting'), holdMs)
      }
    } else {
      if (suffix.length > 0) {
        timeout = setTimeout(() => setSuffix(suffix.slice(0, -1)), deleteSpeed)
      } else {
        timeout = setTimeout(() => {
          setPhraseIndex(i => (i + 1) % rotations.length)
          setPhase('typing')
        }, gapMs)
      }
    }

    return () => clearTimeout(timeout)
  }, [suffix, phase, phraseIndex, rotations])

  return suffix
}

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON    = import.meta.env.VITE_SUPABASE_ANON_KEY
const CHAT_ENDPOINT    = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/chat` : null
const LOG_COMMIT_ENDPOINT = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/log-commit` : null

async function postJson(endpoint, body) {
  if (!endpoint) throw new Error('Supabase not configured')
  const res = await fetch(endpoint, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON}`,
      'apikey':        SUPABASE_ANON,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

async function callChat(message, image = null) {
  return postJson(CHAT_ENDPOINT, { message, image }) // { reply, extraction }
}

async function callLogCommit(payload) {
  return postJson(LOG_COMMIT_ENDPOINT, payload) // { logged }
}

function today() {
  return new Date().toISOString().split('T')[0]
}

// Meal windows, in minutes since local midnight: 4:30am–11am Breakfast,
// 11am–4pm Lunch, 4pm–10pm Dinner, 10pm–4:30am Late Night Snack.
function getMealGreeting(name) {
  const displayName = name || 'there'
  const now = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes()

  if (minutes >= 270 && minutes < 660) return `Hi, ${displayName}. What's for breakfast?`
  if (minutes >= 660 && minutes < 960) return `Hi, ${displayName}. What's for lunch?`
  if (minutes >= 960 && minutes < 1320) return `Hi, ${displayName}. What's for dinner?`
  return `Hi, ${displayName}. Late night snack? Naughty.`
}

let msgCounter = 0
function nextMsgId() { return `msg-${++msgCounter}` }

export default function HekbotPanel({ onLogged, userName }) {
  const [messages, setMessages] = useState([])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)
  const [committingId, setCommittingId] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const inputRef  = useRef(null)
  const threadRef = useRef(null)
  const landingFormRef = useRef(null)
  const { presets, refresh: refreshPresets } = usePresets()
  const helperSuffix = useTypewriterSuffix(HELPER_ROTATIONS)

  const started = messages.length > 0

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [messages, loading])

  // Collapse the landing input back down when clicking anywhere outside it.
  useEffect(() => {
    if (!expanded) return
    function handleClickOutside(e) {
      if (landingFormRef.current && !landingFormRef.current.contains(e.target)) {
        setExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [expanded])

  function hasReviewable(extraction) {
    return extraction && (extraction.food_items?.length > 0 || extraction.body_entry || extraction.workout_entry)
  }

  async function sendMessage(text, image = null) {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    setError(null)
    setMessages(prev => [...prev, { id: nextMsgId(), role: 'user', content: trimmed }])
    setInput('')
    setLoading(true)

    try {
      const { reply, extraction } = await callChat(trimmed, image)
      setMessages(prev => [
        ...prev,
        {
          id: nextMsgId(),
          role: 'assistant',
          content: reply,
          extraction: hasReviewable(extraction) ? extraction : null,
        },
      ])
    } catch (err) {
      setError(err.message)
      setMessages(prev => [
        ...prev,
        { id: nextMsgId(), role: 'assistant', content: "Something went wrong — check the backend connection and try again.", isError: true },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    sendMessage(input)
  }

  function handleTextareaKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file after an error
    if (!file) return

    try {
      const prepared = await prepareImageUpload(file)
      sendMessage(MEAL_PHOTO_PROMPT, prepared)
    } catch (err) {
      const message = err instanceof ImageValidationError
        ? err.message
        : 'Could not process that image — try a different file.'
      setError(message)
      setMessages(prev => [
        ...prev,
        { id: nextMsgId(), role: 'assistant', content: message, isError: true },
      ])
    }
  }

  async function researchFoodItem(query) {
    const { extraction } = await callChat(query)
    return extraction?.food_items?.[0] ?? null
  }

  function handlePresetTap(preset) {
    setMessages(prev => [
      ...prev,
      { id: nextMsgId(), role: 'assistant', content: `Log "${preset.name}" from your presets?`, preset },
    ])
  }

  async function handleConfirmReview(messageId, payload) {
    setCommittingId(messageId)
    try {
      const { logged } = await callLogCommit(payload)
      setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, extraction: null, preset: null, logged } : m)))
      onLogged?.()
      if (payload.save_as_preset?.length > 0) refreshPresets()
    } catch (err) {
      setError(err.message)
    } finally {
      setCommittingId(null)
    }
  }

  function handleDiscardReview(messageId) {
    setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, extraction: null, preset: null, discarded: true } : m)))
  }

  function startOver() {
    setMessages([])
    setError(null)
    setExpanded(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <section className="relative overflow-hidden border-b border-white/[0.08]">
      <DotGridWave overallOpacity={0.12} />

      <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
        {!started ? (
          // ── Landing state — headline + input, no thread yet ──────────────
          <div className="max-w-2xl mx-auto text-center animate-fade-in-up">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-dn-orange animate-pulse [animation-duration:3s]" />
              <span className="font-sans text-[13px] tracking-[0.3em] uppercase text-dn-orange">
                AI Nutrition Coach
              </span>
            </div>

            <h1 className="font-display text-[36px] sm:text-[52px] text-dn-white leading-none tracking-[0.02em] mb-6 sm:mb-8">
              {getMealGreeting(userName)}
            </h1>

            <form
              ref={landingFormRef}
              onSubmit={handleSubmit}
              className={`dn-card relative p-3 sm:p-4 text-left transition-all duration-300 ease-dn ${
                expanded ? 'p-5 sm:p-6 scale-[1.02] shadow-[0_0_0_1px_rgba(255,94,26,0.25),0_16px_48px_rgba(0,0,0,0.55)]' : ''
              }`}
            >
              {expanded && (
                <button
                  type="button"
                  onClick={() => { setExpanded(false); inputRef.current?.blur() }}
                  aria-label="Collapse input"
                  className="absolute top-2.5 right-2.5 text-dn-gray-light hover:text-dn-white transition-colors"
                >
                  <Icon name="close" size={16} />
                </button>
              )}
              <textarea
                ref={inputRef}
                rows={2}
                value={input}
                onChange={e => setInput(e.target.value)}
                onFocus={() => setExpanded(true)}
                onKeyDown={handleTextareaKeyDown}
                placeholder={HELPER_PREFIX + helperSuffix}
                disabled={loading}
                className={`w-full bg-transparent font-sans text-[14px] sm:text-[15px] text-dn-white placeholder-dn-graphite outline-none resize-none disabled:opacity-50 transition-all duration-300 ease-dn ${
                  expanded ? 'min-h-[132px]' : 'min-h-[44px]'
                }`}
              />
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.06]">
                <label
                  aria-label="Upload meal photo"
                  className="cursor-pointer text-dn-gray-light hover:text-dn-white transition-colors"
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleImageUpload}
                    disabled={loading}
                  />
                  <Icon name="add_photo_alternate" size={32} />
                </label>
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 flex items-center justify-center bg-dn-orange rounded-sm hover:bg-dn-orange-light hover:shadow-[0_0_18px_rgba(255,94,26,0.65)] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  <Icon name="send" size={13} className="text-dn-black" />
                </button>
              </div>
            </form>

            <div className="flex items-center justify-center gap-2 flex-wrap mt-5">
              {SUGGESTIONS.map(({ label, icon }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(label)}
                  className="flex items-center gap-1.5 font-sans text-[14px] text-dn-orange border border-dn-orange/30 hover:border-dn-orange/60 hover:bg-dn-orange/10 rounded-sm px-3 py-1.5 transition-all duration-200"
                >
                  <Icon name={icon} size={16} />
                  {label}
                </button>
              ))}
            </div>

            {error && <p className="font-sans text-[14px] text-red-400 mt-4">{error}</p>}
          </div>
        ) : (
          // ── Active thread state ───────────────────────────────────────────
          <div className="max-w-2xl mx-auto dn-card flex flex-col h-[min(72vh,560px)] animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-white/[0.08] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-dn-orange" />
                  <div className="absolute inset-0 rounded-full bg-dn-orange animate-ping opacity-40" />
                </div>
                <span className="font-display text-[18px] text-dn-white tracking-[0.06em] leading-none">
                  HekBot
                </span>
              </div>
              <button
                onClick={startOver}
                className="font-sans text-[13px] uppercase tracking-[0.1em] text-dn-gray-light hover:text-dn-white transition-colors"
              >
                New chat
              </button>
            </div>

            {/* Message thread */}
            <div ref={threadRef} className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-5 h-5 rounded-full bg-dn-orange/20 border border-dn-orange/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-dn-orange" />
                    </div>
                  )}
                  <div className={`flex flex-col gap-1.5 ${(msg.extraction || msg.preset) ? 'max-w-[92%] flex-1' : 'max-w-[80%]'}`}>
                    <div
                      className={`rounded-sm px-3.5 py-2.5 ${
                        msg.role === 'user'
                          ? 'bg-dn-orange/10 border border-dn-orange/20 ml-auto'
                          : msg.isError
                          ? 'bg-red-900/20 border border-red-500/20'
                          : 'bg-dn-gray-mid'
                      }`}
                    >
                      <p className="font-sans text-[13px] text-dn-white leading-relaxed">
                        {msg.content}
                      </p>
                    </div>

                    {/* Pending review — nothing is logged until confirmed */}
                    {(msg.extraction || msg.preset) && (
                      <HekbotReview
                        extraction={msg.extraction}
                        preset={msg.preset}
                        logDate={today()}
                        submitting={committingId === msg.id}
                        onConfirm={payload => handleConfirmReview(msg.id, payload)}
                        onDiscard={() => handleDiscardReview(msg.id)}
                        onResearchItem={researchFoodItem}
                      />
                    )}
                    {msg.discarded && (
                      <span className="ml-0.5 font-sans text-[12px] text-dn-gray-light tracking-[0.12em] uppercase">Discarded</span>
                    )}

                    {/* Logged data badges */}
                    {msg.logged && (
                      <div className="flex flex-col gap-1 ml-0.5">
                        {msg.logged.food?.map((item, j) => (
                          <div key={`food-${j}`} className="flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-green-400 flex-shrink-0" />
                            <span className="font-sans text-[12px] text-green-400 tracking-[0.12em] uppercase">
                              Logged · {item.food_item} · {Math.round(item.kcal ?? 0)} kcal · {Math.round(item.protein_g ?? 0)}g protein
                            </span>
                          </div>
                        ))}
                        {msg.logged.weight && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
                            <span className="font-sans text-[12px] text-blue-400 tracking-[0.12em] uppercase">
                              Logged ·{msg.logged.weight.weight_lbs != null ? ` ${msg.logged.weight.weight_lbs} lbs` : ''}
                              {msg.logged.weight.waist_cm != null ? ` · ${msg.logged.weight.waist_cm} cm waist` : ''}
                            </span>
                          </div>
                        )}
                        {msg.logged.workout && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-dn-orange flex-shrink-0" />
                            <span className="font-sans text-[12px] text-dn-orange tracking-[0.12em] uppercase">
                              Logged · {msg.logged.workout.workout_type}
                              {msg.logged.workout.duration_min ? ` · ${msg.logged.workout.duration_min} min` : ''}
                              {msg.logged.workout.calories_burned ? ` · ${msg.logged.workout.calories_burned} kcal burned` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-dn-orange/20 border border-dn-orange/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-dn-orange" />
                  </div>
                  <div className="bg-dn-gray-mid rounded-sm px-3.5 py-3">
                    <div className="flex items-center gap-1.5">
                      {[0, 150, 300].map(delay => (
                        <div
                          key={delay}
                          className="w-1.5 h-1.5 rounded-full bg-dn-graphite animate-bounce"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Preset chips */}
            {presets.length > 0 && (
              <div className="px-4 sm:px-5 py-2.5 border-t border-white/[0.06] flex items-center gap-2 flex-wrap flex-shrink-0">
                {presets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetTap(preset)}
                    className="font-sans text-[12px] tracking-[0.1em] text-dn-orange border border-dn-orange/25 hover:border-dn-orange/50 rounded-sm px-2.5 py-1.5 transition-all duration-200"
                  >
                    <Icon name="star" size={11} /> {preset.name}
                  </button>
                ))}
              </div>
            )}

            {/* Quick action chips */}
            <div className="px-4 sm:px-5 py-2.5 border-t border-white/[0.06] flex items-center gap-2 flex-wrap flex-shrink-0">
              {QUICK_ACTIONS.map(label => (
                <button
                  key={label}
                  onClick={() => sendMessage(label)}
                  disabled={loading}
                  className="font-sans text-[12px] tracking-[0.15em] uppercase text-dn-gray-light hover:text-dn-white border border-white/[0.08] hover:border-white/20 rounded-sm px-2.5 py-1.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Input bar */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-t border-white/[0.08] bg-dn-black flex-shrink-0"
            >
              <label
                aria-label="Upload meal photo"
                className="flex-shrink-0 cursor-pointer text-dn-gray-light hover:text-dn-white transition-colors"
              >
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleImageUpload}
                  disabled={loading}
                />
                <Icon name="add_photo_alternate" size={32} />
              </label>

              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Tell me what you ate, or ask anything..."
                disabled={loading}
                className="flex-1 bg-transparent font-sans text-[13px] text-dn-white placeholder-dn-graphite outline-none disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-8 h-8 flex items-center justify-center bg-dn-orange rounded-sm flex-shrink-0 hover:bg-dn-orange-light hover:shadow-[0_0_18px_rgba(255,94,26,0.65)] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                <Icon name="send" size={13} className="text-dn-black" />
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  )
}
