import { Link, useNavigate } from 'react-router-dom'
import DNMark from '../DNMark'
import Icon from '../Icon'
import DotGridWave from '../DotGridWave'

export default function Header({ isAdmin = false, onSignOut, currentDate }) {
  const navigate = useNavigate()

  return (
    <header className="relative overflow-hidden border-b border-white/[0.08]">
      <DotGridWave />

      <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6 py-2.5 sm:py-5 flex items-center justify-between">

        {/* DN mark | HEKBOT */}
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
          <DNMark size={20} variant="white" className="sm:hidden shrink-0" />
          <DNMark size={28} variant="white" className="hidden sm:block shrink-0" />
          <div className="w-px h-5 sm:h-7 bg-white/20 shrink-0" />
          <span className="font-display text-[17px] sm:text-[24px] text-dn-white tracking-[0.1em] sm:tracking-[0.12em] leading-none truncate">
            HEKBOT
          </span>
        </Link>

        {/* Today's date — center on desktop */}
        {currentDate && (
          <div className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
            <div className="font-display text-[34px] text-dn-white tracking-[0.06em] leading-none">
              {currentDate}
            </div>
          </div>
        )}

        {/* Right side actions */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          {isAdmin ? (
            <>
              <span className="hidden sm:block font-sans text-[13px] tracking-[0.15em] uppercase text-dn-orange">
                Admin
              </span>
              <button
                onClick={onSignOut}
                className="font-sans text-[13px] sm:text-[14px] text-dn-gray-light hover:text-dn-white transition-colors duration-200 whitespace-nowrap"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/admin/login"
              className="font-sans text-[13px] sm:text-[14px] text-dn-gray-light hover:text-dn-white transition-colors duration-200 whitespace-nowrap"
            >
              Admin <Icon name="arrow_forward" size={11} className="align-[-1px]" />
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
