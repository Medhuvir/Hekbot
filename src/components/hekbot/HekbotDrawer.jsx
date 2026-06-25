import { useState, useRef, useEffect } from 'react'

const QUICK_ACTIONS = ['Daily summary', 'Weekly summary', 'Log weight', 'Log waist']

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON    = import.meta.env.VITE_SUPABASE_ANON_KEY
const CHAT_ENDPOINT    = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/chat` : null

async function callChat(message, image = null) {
  if (!CHAT_ENDPOINT) throw new Error('Supabase not configured')
  const res = await fetch(CHAT_ENDPOINT, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON}`,
      'apikey':        SUPABASE_ANON,
    },
    body: JSON.stringify({ message, image }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  return res.json() // { reply, logged }
}

export default function HekbotDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey Medhuvir — what did you eat today, or what can I help you track?",
    },
  ])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)
  const inputRef  = useRef(null)
  const threadRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 320)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [messages, loading])

  async function sendMessage(text, image = null) {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    setError(null)
    setMessages(prev => [...prev, { role: 'user', content: trimmed }])
    setInput('')
    setLoading(true)

    try {
      const { reply, logged } = await callChat(trimmed, image)
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: reply, logged },
      ])
    } catch (err) {
      setError(err.message)
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "Something went wrong — check the backend connection and try again.", isError: true },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    sendMessage(input)
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => sendMessage(input || 'What are the macros in this meal?', reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-[440px] flex flex-col bg-dn-surface border-l border-white/[0.08] shadow-2xl transition-transform duration-500 ease-dn ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="relative overflow-hidden flex items-center justify-between px-5 py-4 border-b border-white/[0.08] flex-shrink-0 bg-dn-surface-dark">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-dn-orange" />
              <div className="absolute inset-0 rounded-full bg-dn-orange animate-ping opacity-40" />
            </div>
            <div>
              <div className="font-display text-[24px] text-dn-white tracking-[0.08em] leading-none">
                HekBot
              </div>
              <div className="font-sans text-[9px] text-dn-graphite tracking-[0.2em] uppercase mt-0.5">
                AI Nutrition Coach
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close HekBot"
            className="w-8 h-8 flex items-center justify-center text-dn-graphite hover:text-dn-white transition-colors rounded-sm hover:bg-white/[0.06]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Message thread */}
        <div ref={threadRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {msg.role === 'assistant' && (
                <div className="w-5 h-5 rounded-full bg-dn-orange/20 border border-dn-orange/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-dn-orange" />
                </div>
              )}
              <div className="flex flex-col gap-1.5 max-w-[80%]">
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
                {/* Logged food badge */}
                {msg.logged?.food_item && (
                  <div className="flex items-center gap-1.5 ml-0.5">
                    <div className="w-1 h-1 rounded-full bg-green-400" />
                    <span className="font-sans text-[9px] text-green-400 tracking-[0.15em] uppercase">
                      Logged · {msg.logged.food_item} · {Math.round(msg.logged.kcal ?? 0)} kcal · {Math.round(msg.logged.protein_g ?? 0)}g protein
                    </span>
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

        {/* Quick action chips */}
        <div className="px-5 py-3 border-t border-white/[0.06] flex items-center gap-2 flex-wrap flex-shrink-0">
          {QUICK_ACTIONS.map(label => (
            <button
              key={label}
              onClick={() => sendMessage(label)}
              disabled={loading}
              className="font-sans text-[9px] tracking-[0.15em] uppercase text-dn-graphite hover:text-dn-white border border-white/[0.08] hover:border-white/20 rounded-sm px-2.5 py-1.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 px-5 py-4 border-t border-white/[0.08] bg-dn-black flex-shrink-0"
        >
          {/* Image upload */}
          <label className="flex-shrink-0 cursor-pointer text-dn-graphite hover:text-dn-white transition-colors">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleImageUpload}
              disabled={loading}
            />
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-label="Upload meal photo">
              <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="5.5" cy="6.5" r="1" stroke="currentColor" strokeWidth="1.2" />
              <path d="M1 10l3.5-3 3 2.5 2.5-2.5L15 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </label>

          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Tell me what you ate, or ask anything..."
            disabled={loading}
            className="flex-1 bg-transparent font-sans text-[13px] text-dn-white placeholder-dn-graphite outline-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-8 h-8 flex items-center justify-center bg-dn-orange rounded-sm flex-shrink-0 hover:bg-dn-orange-dark transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path d="M2 6.5h9M7 2l4.5 4.5L7 11" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </div>
    </>
  )
}
