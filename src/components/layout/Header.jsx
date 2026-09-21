import { Link, useNavigate } from 'react-router-dom'
import DNMark from '../DNMark'
import Icon from '../Icon'
import TopoBackground from '../TopoBackground'

export default function Header({ isAdmin = false, onSignOut, currentDate }) {
  const navigate = useNavigate()

  return (
    <header className="relative overflow-hidden bg-dn-black border-b border-white/[0.08]">
      <TopoBackground opacity={0.09} />

      <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6 py-2.5 sm:py-5 flex items-center justify-between">

        {/* DN Lockup 1 — Horizontal Primary */}
        <Link to="/" className="flex items-center gap-2 sm:gap-3.5 group min-w-0">
          <DNMark size={20} variant="white" className="sm:hidden shrink-0" />
          <DNMark size={28} variant="white" className="hidden sm:block shrink-0" />
          <div className="hidden sm:block w-px h-9 bg-white/20 shrink-0" />
          <div className="min-w-0">
            <div className="font-display text-[15px] sm:text-[22px] text-dn-white tracking-[0.1em] sm:tracking-[0.12em] leading-none truncate">
              DN Creative
            </div>
            <div className="hidden sm:block font-sans text-[8px] font-normal tracking-[0.25em] uppercase text-dn-orange mt-0.5">
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
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          {isAdmin ? (
            <>
              <span className="hidden sm:block font-sans text-[10px] tracking-[0.15em] uppercase text-dn-orange">
                Admin
              </span>
              <button
                onClick={onSignOut}
                className="font-sans text-[10px] sm:text-[11px] text-dn-graphite hover:text-dn-white transition-colors duration-200 whitespace-nowrap"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/admin/login"
              className="font-sans text-[10px] sm:text-[11px] text-dn-graphite hover:text-dn-white transition-colors duration-200 whitespace-nowrap"
            >
              Admin <Icon name="arrow_forward" size={11} className="align-[-1px]" />
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
