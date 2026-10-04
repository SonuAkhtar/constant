import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import type { DailyProgress } from '../../types'
import './WeeklyChart.css'

const TICKS = [100, 50, 0]

export function WeeklyChart({ data, avg }: { data: DailyProgress[]; avg: number }) {
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const plotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    if (!active) return
    const onPointerDown = (e: PointerEvent) => {
      if (!plotRef.current?.contains(e.target as Node)) setActive(null)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [active])

  const activeDay = data.find((d) => d.date === active)

  return (
    <div className="progress-page__chart-wrap">
      <div className="wchart">
        <div className="wchart__axis" aria-hidden="true">
          {TICKS.map((t) => (
            <span key={t} className="wchart__tick" style={{ bottom: `${t}%` }}>{t}%</span>
          ))}
        </div>

        <div className="wchart__plot" ref={plotRef} onMouseLeave={() => setActive(null)}>
          {TICKS.map((t) => (
            <div key={t} className="wchart__grid" style={{ bottom: `${t}%` }} aria-hidden="true" />
          ))}
          {avg > 0 && (
            <div className="wchart__avg" style={{ bottom: `${avg}%` }} aria-hidden="true" />
          )}

          <ul className="wchart__bars" aria-label="Daily completion, last 7 days">
            {data.map((d, i) => {
              const empty = d.total === 0 || d.percentage === 0
              const label = `${format(new Date(`${d.date}T00:00:00`), 'EEEE, MMM d')}: ${d.percentage}%, ${d.completed} of ${d.total} done`
              return (
                <li key={d.date} className="wchart__col">
                  <button
                    type="button"
                    className={[
                      'wchart__hit',
                      active === d.date ? 'wchart__hit--active' : '',
                    ].join(' ')}
                    aria-label={label}
                    onMouseEnter={() => setActive(d.date)}
                    onClick={() => setActive(d.date)}
                  >
                    <span
                      className={[
                        'wchart__bar',
                        empty ? 'wchart__bar--empty' : '',
                        d.date === todayStr ? 'wchart__bar--today' : '',
                      ].filter(Boolean).join(' ')}
                      style={{
                        height: empty ? undefined : `${d.percentage}%`,
                        transform: mounted ? 'scaleY(1)' : 'scaleY(0)',
                        transitionDelay: `${i * 40}ms`,
                      }}
                    />
                  </button>
                </li>
              )
            })}
          </ul>

          {activeDay && (
            <div
              className="progress-page__tooltip wchart__tooltip"
              style={{ left: `${((data.indexOf(activeDay) + 0.5) / data.length) * 100}%` }}
              aria-hidden="true"
            >
              <p className="progress-page__tooltip-date">
                {format(new Date(`${activeDay.date}T00:00:00`), 'EEE, MMM d')}
              </p>
              <p className="progress-page__tooltip-value">{activeDay.percentage}%</p>
              <p className="progress-page__tooltip-sub">
                {activeDay.completed} of {activeDay.total} done
              </p>
            </div>
          )}
        </div>

        <div className="wchart__days" aria-hidden="true">
          {data.map((d) => (
            <span key={d.date}>{format(new Date(`${d.date}T00:00:00`), 'EEE')}</span>
          ))}
        </div>
      </div>

      <div className="progress-page__chart-legend">
        <span className="progress-page__chart-legend-dot progress-page__chart-legend-dot--dim" />
        <span className="progress-page__chart-legend-text">Past days</span>
        <span className="progress-page__chart-legend-dot" />
        <span className="progress-page__chart-legend-text">Today</span>
      </div>
    </div>
  )
}
