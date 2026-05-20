import { format } from 'date-fns'
import type { DailyProgress } from '../../types'

function getIntensity(pct: number) {
  if (pct === 0) return 'none'
  if (pct < 25) return 'low'
  if (pct < 50) return 'medium'
  if (pct < 75) return 'high'
  if (pct < 100) return 'very-high'
  return 'complete'
}

export function MonthlyHeatmap({ data }: { data: DailyProgress[] }) {
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const firstDate = new Date(
    `${data[0]?.date ?? format(new Date(), 'yyyy-MM-dd')}T00:00:00`,
  )
  const startOffset = firstDate.getDay()

  return (
    <>
      <div className="progress-page__heatmap-meta">
        <div className="progress-page__heatmap-legend">
          <span className="progress-page__legend-label">Less</span>
          {(['none', 'low', 'medium', 'high', 'very-high', 'complete'] as const).map((i) => (
            <div key={i} className={`heatmap__cell heatmap__cell--${i} heatmap__cell--legend`} />
          ))}
          <span className="progress-page__legend-label">More</span>
        </div>
      </div>

      <div className="heatmap" role="grid" aria-label="Monthly completion heatmap">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, i) => (
          <div
            key={i}
            className="heatmap__col-label"
            role="columnheader"
            aria-label={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}
          >
            {label}
          </div>
        ))}
        {Array.from({ length: startOffset }, (_, i) => (
          <div
            key={`empty-${i}`}
            className="heatmap__cell heatmap__cell--empty"
            role="gridcell"
            aria-hidden="true"
          />
        ))}
        {data.map((day) => {
          const isToday = day.date === todayStr
          const dateObj = new Date(`${day.date}T00:00:00`)
          const dateLabel = format(dateObj, 'MMM d')
          return (
            <div
              key={day.date}
              role="gridcell"
              tabIndex={0}
              className={[
                'heatmap__cell',
                `heatmap__cell--${getIntensity(day.percentage)}`,
                isToday ? 'heatmap__cell--today' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              title={`${dateLabel}: ${day.percentage}% (${day.completed}/${day.total})`}
              aria-label={`${dateLabel}: ${day.percentage}% complete, ${day.completed} of ${day.total} habits`}
            />
          )
        })}
      </div>
    </>
  )
}
