import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useHabitStore } from '../../store/useHabitStore'
import './BottomNav.css'

function TodayIcon({ active }: { active?: boolean }) {
  const w = active ? 1.9 : 1.5
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="3.5" stroke="currentColor" strokeWidth={w} />
      <path
        d="M11 2.5V4M11 18v1.5M2.5 11H4M18 11h1.5M4.4 4.4l1.1 1.1M16.5 16.5l1.1 1.1M16.5 5.5l1.1-1.1M4.4 17.6l1.1-1.1"
        stroke="currentColor" strokeWidth={w} strokeLinecap="round"
      />
    </svg>
  )
}

function ProgressIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect x="2.5" y="13" width="4" height="6.5" rx="1.2" fill="currentColor" opacity={active ? 1 : 0.7} />
      <rect x="9" y="9" width="4" height="10.5" rx="1.2" fill="currentColor" opacity={active ? 1 : 0.7} />
      <rect x="15.5" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" opacity={active ? 1 : 0.7} />
    </svg>
  )
}

function HabitsIcon({ active }: { active?: boolean }) {
  const w = active ? 1.8 : 1.5
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect x="2.5" y="4.5" width="5" height="5" rx="1.4" stroke="currentColor" strokeWidth={w} />
      <rect x="2.5" y="12.5" width="5" height="5" rx="1.4" stroke="currentColor" strokeWidth={w} />
      <path d="M4.5 7l1 1 2-2" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      <line x1="11" y1="7"  x2="19.5" y2="7"  stroke="currentColor" strokeWidth={w} strokeLinecap="round" />
      <line x1="11" y1="10" x2="16"   y2="10" stroke="currentColor" strokeWidth={w} strokeLinecap="round" />
      <line x1="11" y1="15" x2="19.5" y2="15" stroke="currentColor" strokeWidth={w} strokeLinecap="round" />
      <line x1="11" y1="18" x2="16"   y2="18" stroke="currentColor" strokeWidth={w} strokeLinecap="round" />
    </svg>
  )
}

function ProfileIcon({ active }: { active?: boolean }) {
  const w = active ? 1.8 : 1.5
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="8" r="3.5" stroke="currentColor" strokeWidth={w} />
      <path d="M3.5 19c0-3.5 3.4-6.5 7.5-6.5s7.5 3 7.5 6.5"
        stroke="currentColor" strokeWidth={w} strokeLinecap="round" />
    </svg>
  )
}

function WellnessIcon({ active }: { active?: boolean }) {
  const w = active ? 1.8 : 1.5
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M11 3.5C9 3.5 6 5.5 6 9c0 4 5 9 5 9s5-5 5-9c0-3.5-3-5.5-5-5.5z"
        stroke="currentColor" strokeWidth={w} strokeLinejoin="round" />
      <circle cx="11" cy="9" r="1.8" stroke="currentColor" strokeWidth={w - 0.2} />
    </svg>
  )
}

const NAV_ITEMS = [
  { to: '/',          label: 'Today',    Icon: TodayIcon    },
  { to: '/progress',  label: 'Progress', Icon: ProgressIcon },
  { to: '/habits',    label: 'Habits',   Icon: HabitsIcon   },
  { to: '/wellness',  label: 'Wellness', Icon: WellnessIcon },
  { to: '/profile',   label: 'Profile',  Icon: ProfileIcon  },
]

export default function BottomNav() {
  const { getDayProgress } = useHabitStore()
  const { percentage } = getDayProgress()

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav__progress-track">
        <motion.div
          className={[
            'bottom-nav__progress-fill',
            percentage === 100 ? 'bottom-nav__progress-fill--complete' : '',
          ].join(' ')}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
        />
      </div>
      {NAV_ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            ['bottom-nav__item', isActive ? 'bottom-nav__item--active' : ''].join(' ')
          }
        >
          {({ isActive }) => (
            <span className="bottom-nav__inner">
              <span className="bottom-nav__icon-bubble">
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="bottom-nav__pill"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="bottom-nav__icon-svg">
                  <motion.span
                    whileTap={{ scale: 0.78, rotate: -5 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                    style={{ display: 'flex' }}
                  >
                    <Icon active={isActive} />
                  </motion.span>
                </span>
              </span>
              <span className="bottom-nav__label">{label}</span>
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
