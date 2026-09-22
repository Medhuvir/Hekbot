import { Link } from 'react-router-dom'
import DNMark from '../DNMark'
import Icon from '../Icon'
import DotGridWave from '../DotGridWave'

function DateNavControls({
  currentDate,
  isToday,
  onPrevDay,
  onNextDay,
  onToday,
  dateInputValue,
  maxDate,
  onPickDate,
  large = false,
}) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <button
        onClick={onPrevDay}
        aria-label="Previous day"
        className="text-dn-gray-light hover:text-dn-white transition-colors p-0.5"
      >
        <Icon name="chevron_left" size={large ? 20 : 16} />
      </button>

      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className={`font-display ${large ? 'text-[34px]' : 'text-[18px]'} text-dn-white tracking-[0.06em] leading-none`}>
            {currentDate}
          </span>
          <div className="relative flex items-center justify-center w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0">
            <Icon
              name="calendar_month"
              size={large ? 16 : 13}
              className="pointer-events-none text-dn-gray-light"
            />
            <input
              type="date"
              value={dateInputValue}
              max={maxDate}
              onChange={e => e.target.value && onPickDate(e.target.value)}
              aria-label="Pick a date"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
        {!isToday && (
          <button
            onClick={onToday}
            className="font-sans text-[9px] sm:text-[10px] uppercase tracking-[0.15em] text-dn-orange mt-0.5 hover:underline underline-offset-2 whitespace-nowrap"
          >
            Jump to today
          </button>
        )}
      </div>

      <button
        onClick={onNextDay}
        disabled={isToday}
        aria-label="Next day"
        className="text-dn-gray-light hover:text-dn-white transition-colors p-0.5 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Icon name="chevron_right" size={large ? 20 : 16} />
      </button>
    </div>
  )
}

export default function Header({
  isAdmin = false,
  onSignOut,
  currentDate,
  isToday = true,
  dateInputValue,
  maxDate,
  onPrevDay,
  onNextDay,
  onToday,
  onPickDate,
}) {
  const hasDateNav = Boolean(currentDate && onPrevDay && onNextDay && onPickDate)

  return (
    <header className="relative overflow-hidden border-b border-white/[0.08]">
      <DotGridWave />

      <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6 py-2.5 sm:py-5 flex items-center justify-between">

        {/* DN mark | HEKBOT */}
        <Link to={isAdmin ? '/app' : '/'} className="flex items-center gap-2 sm:gap-3 group min-w-0">
          <DNMark size={20} variant="white" className="sm:hidden shrink-0" />
          <DNMark size={28} variant="white" className="hidden sm:block shrink-0" />
          <div className="w-px h-5 sm:h-7 bg-white/20 shrink-0" />
          <span className="font-display text-[17px] sm:text-[24px] text-dn-white tracking-[0.1em] sm:tracking-[0.12em] leading-none truncate">
            HEKBOT
          </span>
        </Link>

        {/* Today's date + day navigation — center on desktop */}
        {hasDateNav && (
          <div className="hidden sm:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
            <DateNavControls
              currentDate={currentDate}
              isToday={isToday}
              onPrevDay={onPrevDay}
              onNextDay={onNextDay}
              onToday={onToday}
              dateInputValue={dateInputValue}
              maxDate={maxDate}
              onPickDate={onPickDate}
              large
            />
          </div>
        )}

        {/* Right side actions */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          {isAdmin ? (
            <button
              onClick={onSignOut}
              className="font-sans text-[13px] sm:text-[14px] text-dn-gray-light hover:text-dn-white transition-colors duration-200 whitespace-nowrap"
            >
              Sign out
            </button>
          ) : (
            <Link
              to="/login"
              className="font-sans text-[13px] sm:text-[14px] text-dn-gray-light hover:text-dn-white transition-colors duration-200 whitespace-nowrap"
            >
              Sign in <Icon name="arrow_forward" size={11} className="align-[-1px]" />
            </Link>
          )}
        </div>
      </div>

      {/* Mobile date row — a full-width second row avoids crowding the logo/actions row */}
      {hasDateNav && (
        <div className="sm:hidden relative flex items-center justify-center pb-2.5 -mt-1">
          <DateNavControls
            currentDate={currentDate}
            isToday={isToday}
            onPrevDay={onPrevDay}
            onNextDay={onNextDay}
            onToday={onToday}
            dateInputValue={dateInputValue}
            maxDate={maxDate}
            onPickDate={onPickDate}
          />
        </div>
      )}
    </header>
  )
}
