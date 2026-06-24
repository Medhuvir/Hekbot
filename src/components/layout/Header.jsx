import { Link, useNavigate } from 'react-router-dom'
import DNMark from '../DNMark'
import TopoBackground from '../TopoBackground'

export default function Header({ isAdmin = false, onSignOut, currentDate }) {
  const navigate = useNavigate()

  return (
    <header className="relative overflow-hidden bg-dn-black border-b border-white/[0.08]">
      <TopoBackground opacity={0.09} />

      <div className="relative max-w-screen-xl mx-auto px-6 py-5 flex items-center justify-between">

        {/* DN Lockup 1 — Horizontal Primary */}
        <Link to="/" className="flex items-center gap-3.5 group">
          <DNMark size={28} variant="white" />
          <div className="w-px h-9 bg-white/20" />
          <div>
            <div className="font-display text-[22px] text-dn-white tracking-[0.12em] leading-none">
              DN Creative
            </div>
            <div className="font-sans text-[8px] font-normal tracking-[0.25em] uppercase text-dn-orange mt-0.5">
              Design Studio
            </div>
          </div>
        </Link>

        {/* App title — center on desktop */}
        <div className="hidden md:flex flex-col items-center absolute left-1/2 -translate-x-1/2">
          <div className="font-display text-[28px] text-dn-white tracking-[0.08em] leading-none">
            Ascension
          </div>
          {currentDate && (
            <div className="font-sans text-[10px] text-dn-graphite tracking-[0.15em] uppercase mt-1">
              {currentDate}
            </div>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {isAdmin ? (
            <>
              <span className="hidden sm:block font-sans text-[10px] tracking-[0.15em] uppercase text-dn-orange">
                Admin
              </span>
              <button
                onClick={onSignOut}
                className="font-sans text-[11px] text-dn-graphite hover:text-dn-white transition-colors duration-200"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/admin/login"
              className="font-sans text-[11px] text-dn-graphite hover:text-dn-white transition-colors duration-200"
            >
              Admin →
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
