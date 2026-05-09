import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { useHabitStore } from '../../store/useHabitStore'
import { useThemeStore } from '../../store/useThemeStore'
import cLogoUrl from '../../assets/c-logo.png'
import './Header.css'

interface Props {
  scrolled?: boolean
}

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.06 1.06M11.54 11.54l1.06 1.06M11.54 4.46l1.06-1.06M3.4 12.6l1.06-1.06"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.5 10a6 6 0 01-7.5-7.5A6 6 0 1013.5 10z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Header({ scrolled = false }: Props) {
  const { habits } = useHabitStore()
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'
  const location = useLocation()

  const now       = new Date()
  const dayAbbr   = format(now, 'EEE').toUpperCase()
  const monthAbbr = format(now, 'MMM').toUpperCase()
  const dayNum    = format(now, 'd')

  const isProgress = location.pathname === '/progress'
  const isHabits   = location.pathname === '/habits'

  return (
    <header className={['header', scrolled ? 'header--scrolled' : ''].join(' ')}>
      <div className="header__brand">
        <img src={cLogoUrl} className="header__logo" alt="Constant" />
        <span className="header__app-name">Constant</span>
      </div>

      <div className="header__actions">
        <AnimatePresence mode="wait">
          {isHabits ? (
            <motion.div
              key="habits-badge"
              className="header__date-badge"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.18 }}
              aria-label={`${habits.length} habits`}
            >
              <span className="header__date-badge-day">TOTAL</span>
              <span className="header__date-badge-num">{habits.length}</span>
            </motion.div>
          ) : isProgress ? (
            <motion.div
              key="progress-badge"
              className="header__date-badge"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.18 }}
              aria-label="Last 30 days"
            >
              <span className="header__date-badge-day">LAST</span>
              <span className="header__date-badge-num">30</span>
            </motion.div>
          ) : (
            <motion.div
              key="date-badge"
              className="header__date-badge"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.18 }}
              aria-label={format(now, 'EEEE, MMMM d')}
            >
              <span className="header__date-badge-day">{dayAbbr}</span>
              <span className="header__date-badge-num">{monthAbbr} {dayNum}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          className="header__theme-toggle"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-pressed={isDark}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={isDark ? 'sun' : 'moon'}
              initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{ display: 'flex' }}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </motion.span>
          </AnimatePresence>
        </button>

      </div>
    </header>
  )
}
