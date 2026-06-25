import { useState } from 'react'
import TopoBackground from '../TopoBackground'
import HekbotDrawer from './HekbotDrawer'

export default function HekbotHero() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <section className="relative overflow-hidden bg-dn-surface-dark border-b border-white/[0.08]">
        <TopoBackground opacity={0.07} />

        <div className="relative max-w-screen-xl mx-auto px-6 py-14 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left — HekBot identity block */}
          <div className="animate-fade-in-up">
            {/* Label */}
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-1.5 h-1.5 rounded-full bg-dn-orange" />
              <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-dn-orange">
                AI Nutrition Coach
              </span>
            </div>

            {/* Name */}
            <h1 className="font-display text-[92px] text-dn-white leading-none tracking-[0.04em] mb-4">
              HekBot
            </h1>

            {/* Divider */}
            <div className="w-12 h-px bg-dn-orange mb-5" />

            {/* Description */}
            <p className="font-sans text-[13px] text-dn-graphite leading-relaxed max-w-sm">
              Log meals by description or photo. Track macros in real time.
              Get coaching insights calibrated to the Ascension.
            </p>

            {/* Meta tags */}
            <div className="flex items-center gap-3 mt-6">
              {['Macros', 'Coaching', 'Weekly Check-ins'].map(tag => (
                <span
                  key={tag}
                  className="font-sans text-[9px] tracking-[0.2em] uppercase text-dn-graphite border border-white/[0.08] rounded-sm px-2.5 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right — Embedded chat preview card */}
          <div
            className="dn-card cursor-pointer animate-fade-in-up d2 group"
            onClick={() => setOpen(true)}
          >
            {/* Card header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-dn-black/40">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-1.5 h-1.5 rounded-full bg-dn-orange" />
                  <div className="absolute inset-0 rounded-full bg-dn-orange animate-ping opacity-50" />
                </div>
                <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-dn-graphite">
                  HekBot
                </span>
              </div>
              <span className="font-sans text-[9px] text-dn-graphite/50 tracking-[0.1em] uppercase">
                Click to chat
              </span>
            </div>

            {/* Preview message thread */}
            <div className="px-4 pt-4 pb-3 space-y-3">
              {/* Bot message */}
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-dn-orange/20 border border-dn-orange/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-dn-orange" />
                </div>
                <div className="bg-dn-gray-mid rounded-sm px-3.5 py-2.5 max-w-[85%]">
                  <p className="font-sans text-[12px] text-dn-white/80 leading-snug">
                    Hey Medhuvir — what did you eat today, or what can I help you track?
                  </p>
                </div>
              </div>

              {/* User placeholder */}
              <div className="flex justify-end">
                <div className="bg-dn-orange/10 border border-dn-orange/20 rounded-sm px-3.5 py-2.5 max-w-[75%]">
                  <p className="font-sans text-[12px] text-dn-graphite italic leading-snug">
                    Start a conversation...
                  </p>
                </div>
              </div>
            </div>

            {/* Clickable input row */}
            <div className="flex items-center gap-3 mx-4 mb-4 bg-dn-black border border-white/[0.08] group-hover:border-white/20 rounded-sm px-4 py-2.5 transition-colors duration-300">
              <span className="flex-1 font-sans text-[13px] text-dn-graphite select-none">
                Tell me what you ate, or ask anything...
              </span>
              <div className="w-7 h-7 flex items-center justify-center bg-dn-orange rounded-sm flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <path
                    d="M2 6.5h9M7 2l4.5 4.5L7 11"
                    stroke="#0A0A0A"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Quick action chips */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.06] flex-wrap">
              {['Daily summary', 'Weekly summary', 'Log weight', 'Log waist'].map(label => (
                <button
                  key={label}
                  onClick={e => { e.stopPropagation(); setOpen(true) }}
                  className="font-sans text-[9px] tracking-[0.15em] uppercase text-dn-graphite hover:text-dn-white border border-white/[0.08] hover:border-white/20 rounded-sm px-2.5 py-1.5 transition-all duration-200"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

      <HekbotDrawer isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
