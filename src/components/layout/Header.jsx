import { useState } from 'react'
import { Link } from 'react-router-dom'
import DNMark from '../DNMark'
import Icon from '../Icon'
import DatePickerPopover from './DatePickerPopover'

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
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="relative flex items-center gap-1 sm:gap-2">
      <button
        onClick={onPrevDay}
        aria-label="Previous day"
        className="text-dn-orange hover:text-dn-orange-light transition-colors p-0.5"
      >
        <Icon name="chevron_left" size={large ? 20 : 16} />
      </button>

      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className={`font-display ${large ? 'text-[34px]' : 'text-[18px]'} text-dn-white tracking-[0.06em] leading-none`}>
            {currentDate}
          </span>
          <button
            type="button"
            data-datepicker-toggle
            onClick={() => setPickerOpen(o => !o)}
            aria-label="Pick a date"
            aria-expanded={pickerOpen}
            className={`flex items-center justify-center shrink-0 text-dn-orange hover:text-dn-orange-light transition-colors ${large ? 'w-7 h-7' : 'w-5 h-5'}`}
          >
            <Icon name="calendar_month" size={large ? 26 : 18} />
          </button>
        </div>
        {!isToday && (
          <button
            onClick={onToday}
            className="font-sans text-[11px] sm:text-[12px] uppercase tracking-[0.15em] text-dn-orange mt-0.5 hover:underline underline-offset-2 whitespace-nowrap"
          >
            Jump to today
          </button>
        )}
      </div>

      <button
        onClick={onNextDay}
        disabled={isToday}
        aria-label="Next day"
        className="text-dn-orange hover:text-dn-orange-light transition-colors p-0.5 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-dn-orange"
      >
        <Icon name="chevron_right" size={large ? 20 : 16} />
      </button>

      {pickerOpen && (
        <DatePickerPopover
          value={dateInputValue}
          max={maxDate}
          onPick={onPickDate}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}

export default function Header({
  isAdmin = false,
  onSignOut,
  onOpenAdmin,
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
    <header className="relative z-30 border-b border-white/[0.08]">

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
            <>
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1 font-sans text-[15px] sm:text-[16px] text-dn-orange hover:text-dn-orange-light transition-colors duration-200 whitespace-nowrap"
              >
                <Icon name="person" size={15} />
                Admin
              </button>
              <div className="w-px h-4 bg-white/20" aria-hidden="true" />
              <button
                onClick={onSignOut}
                className="flex items-center gap-1 font-sans text-[15px] sm:text-[16px] text-dn-orange hover:text-dn-orange-light transition-colors duration-200 whitespace-nowrap"
              >
                <Icon name="door_open" size={15} />
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1 font-sans text-[15px] sm:text-[16px] text-dn-orange hover:text-dn-orange-light transition-colors duration-200 whitespace-nowrap"
            >
              <Icon name="person" size={14} />
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
