import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { isScheduledOn } from '../../utils/schedule'
import type { Habit, HabitLog } from '../../types'

type DayStatus = 'done' | 'skip' | 'miss' | 'off'

export interface HabitPeriodStat {
  habit: Habit
  rate: number
  completed: number
  skipped: number
  scheduled: number
  dayStats: { date: string; status: DayStatus }[]
}

function rateColor(rate: number): string {
  if (rate >= 80) return 'var(--color-success)'
  if (rate >= 50) return 'var(--color-primary)'
  if (rate >= 25) return 'var(--color-warning)'
  return 'var(--color-error)'
}

export function computeHabitStats(
  habits: Habit[],
  logs: HabitLog[],
  dates: string[],
): HabitPeriodStat[] {
  return habits
    .filter((h) => !h.isArchived)
    .map((habit) => {
      const dayStats = dates.map((date) => {
        const dow = new Date(`${date}T00:00:00`).getDay()
        if (!isScheduledOn(habit, dow)) return { date, status: 'off' as DayStatus }
        const log = logs.find((l) => l.habitId === habit.id && l.date === date)
        if (!log) return { date, status: 'miss' as DayStatus }
        if (log.completed) return { date, status: 'done' as DayStatus }
        if (log.skipped) return { date, status: 'skip' as DayStatus }
        return { date, status: 'miss' as DayStatus }
      })
      const scheduled = dayStats.filter((d) => d.status !== 'off').length
      const completed = dayStats.filter((d) => d.status === 'done').length
      const skipped = dayStats.filter((d) => d.status === 'skip').length
      const rate = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0
      return { habit, rate, completed, skipped, scheduled, dayStats }
    })
    .sort((a, b) => b.rate - a.rate)
}

const WEEK_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function MiniCalendar({
  dayStats,
  view,
}: {
  dayStats: { date: string; status: DayStatus }[]
  view: 'week' | 'month'
}) {
  if (view === 'week') {
    return (
      <div className="ph-mini-cal">
        {dayStats.map(({ date, status }) => {
          const dow = new Date(`${date}T00:00:00`).getDay()
          return (
            <div key={date} className="ph-mini-cal__col">
              <span className="ph-mini-cal__lbl">{WEEK_LABELS[dow]}</span>
              <div className={`ph-mini-cal__dot ph-mini-cal__dot--${status}`} />
            </div>
          )
        })}
      </div>
    )
  }
  return (
    <div className="ph-mini-dots">
      {dayStats.map(({ date, status }) => (
        <div
          key={date}
          className={`ph-mini-dots__dot ph-mini-dots__dot--${status}`}
          title={`${date}: ${status}`}
        />
      ))}
    </div>
  )
}

function HabitPerfRow({
  stat,
  index,
  view,
}: {
  stat: HabitPeriodStat
  index: number
  view: 'week' | 'month'
}) {
  const [open, setOpen] = useState(false)
  const color = rateColor(stat.rate)
  const missed = Math.max(0, stat.scheduled - stat.completed - stat.skipped)

  return (
    <div className={`ph-row${open ? ' ph-row--open' : ''}`}>
      <button
        className="ph-row__btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="ph-row__icon" aria-hidden="true">
          {stat.habit.icon}
        </span>
        <span className="ph-row__name">{stat.habit.title}</span>
        <div className="ph-row__track">
          <motion.div
            className="ph-row__fill"
            style={{ background: color }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: stat.rate / 100 }}
            transition={{
              delay: index * 0.05,
              duration: 0.55,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          />
        </div>
        {stat.skipped > 0 && (
          <span className="ph-row__skip-badge">{stat.skipped} skip</span>
        )}
        <span className="ph-row__pct" style={{ color }}>
          {stat.rate}%
        </span>
        <svg
          className={`ph-chevron${open ? ' ph-chevron--open' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 5l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="ph-row__detail"
            key="detail"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="ph-row__detail-inner">
              <MiniCalendar dayStats={stat.dayStats} view={view} />
              <div className="ph-row__counts">
                <div className="ph-row__count ph-row__count--done">
                  <span className="ph-row__count-val">{stat.completed}</span>
                  <span className="ph-row__count-lbl">Done</span>
                </div>
                <div className="ph-row__count ph-row__count--skip">
                  <span className="ph-row__count-val">{stat.skipped}</span>
                  <span className="ph-row__count-lbl">Skipped</span>
                </div>
                <div className="ph-row__count ph-row__count--miss">
                  <span className="ph-row__count-val">{missed}</span>
                  <span className="ph-row__count-lbl">Missed</span>
                </div>
                <div className="ph-row__count">
                  <span className="ph-row__count-val">{stat.scheduled}</span>
                  <span className="ph-row__count-lbl">Scheduled</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function HabitBreakdown({
  stats,
  view,
}: {
  stats: HabitPeriodStat[]
  view: 'week' | 'month'
}) {
  if (stats.length === 0) return null
  const strong = stats.filter((s) => s.rate >= 80).length
  const mid = stats.filter((s) => s.rate >= 50 && s.rate < 80).length
  const low = stats.filter((s) => s.rate >= 25 && s.rate < 50).length
  const struggling = stats.filter((s) => s.rate < 25 && s.scheduled > 0).length
  return (
    <div className="ph-section">
      <div className="ph-section__header">
        <h3 className="ph-section__title">Habit breakdown</h3>
        <div className="ph-section__badges">
          {strong > 0 && (
            <span className="ph-badge ph-badge--strong">{strong} strong</span>
          )}
          {mid > 0 && (
            <span className="ph-badge ph-badge--mid">{mid} on track</span>
          )}
          {low > 0 && (
            <span className="ph-badge ph-badge--low">{low} needs work</span>
          )}
          {struggling > 0 && (
            <span className="ph-badge ph-badge--struggling">
              {struggling} struggling
            </span>
          )}
        </div>
      </div>
      <div className="ph-list">
        {stats.map((stat, i) => (
          <HabitPerfRow key={stat.habit.id} stat={stat} index={i} view={view} />
        ))}
      </div>
    </div>
  )
}
