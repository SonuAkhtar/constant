import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  type BarShapeProps,
} from 'recharts'
import type { DailyProgress } from '../../types'

const TICK_STYLE = { fontSize: 10, fill: 'var(--color-text-faint)' } as const

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: DailyProgress }[]
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="progress-page__tooltip">
      <p className="progress-page__tooltip-date">
        {format(new Date(`${d.date}T00:00:00`), 'EEE, MMM d')}
      </p>
      <p className="progress-page__tooltip-value">{d.percentage}%</p>
      <p className="progress-page__tooltip-sub">
        {d.completed} of {d.total} done
      </p>
    </div>
  )
}

export function WeeklyChart({ data, avg }: { data: DailyProgress[]; avg: number }) {
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const [mounted, setMounted] = useState(false)
  const reducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="progress-page__chart-wrap">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          barCategoryGap="30%"
          margin={{ top: 8, right: 4, left: -28, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--color-border)"
            strokeDasharray="4 4"
          />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => format(new Date(`${d}T00:00:00`), 'EEE')}
            tick={TICK_STYLE}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 50, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={TICK_STYLE}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: 'rgba(128, 128, 128, 0.07)', radius: 6 }}
          />
          {avg > 0 && (
            <ReferenceLine
              y={avg}
              stroke="var(--color-border)"
              strokeDasharray="4 3"
              strokeWidth={1.5}
            />
          )}
          <Bar
            dataKey="percentage"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
            shape={(props: BarShapeProps & { index?: number }) => {
              const { x = 0, y = 0, width = 0, height = 0, index = 0 } = props
              const entry = props.payload as DailyProgress
              const h = Math.max(height, 0)
              const isEmpty = entry.total === 0 || entry.percentage === 0
              return (
                <rect
                  x={x}
                  y={isEmpty ? y + h - 3 : y}
                  width={width}
                  height={isEmpty ? 3 : h}
                  rx={4}
                  ry={4}
                  fill={isEmpty ? 'var(--color-surface-alt)' : 'var(--color-primary)'}
                  fillOpacity={isEmpty ? 1 : entry.date === todayStr ? 1 : 0.55}
                  style={
                    reducedMotion
                      ? undefined
                      : {
                          transformBox: 'fill-box',
                          transformOrigin: 'bottom',
                          transform: mounted ? 'scaleY(1)' : 'scaleY(0)',
                          transition: `transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 40}ms`,
                        }
                  }
                />
              )
            }}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="progress-page__chart-legend">
        <span className="progress-page__chart-legend-dot progress-page__chart-legend-dot--dim" />
        <span className="progress-page__chart-legend-text">Past days</span>
        <span className="progress-page__chart-legend-dot" />
        <span className="progress-page__chart-legend-text">Today</span>
      </div>
    </div>
  )
}
