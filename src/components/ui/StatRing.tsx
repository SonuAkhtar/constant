import { useState, useEffect } from 'react'

const SR = 17
const SC = +(2 * Math.PI * SR).toFixed(2)

export function StatRing({ pct, className = '' }: { pct: number; className?: string }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])
  const dash = mounted ? (Math.min(pct, 100) / 100) * SC : 0
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 42 42"
      className={`progress-page__stat-ring ${className}`}
      aria-hidden="true"
    >
      <circle cx="21" cy="21" r={SR} className="progress-page__stat-ring-track" />
      <circle
        cx="21"
        cy="21"
        r={SR}
        className="progress-page__stat-ring-fill"
        strokeDasharray={SC}
        strokeDashoffset={SC - dash}
        style={{
          transition: mounted ? 'stroke-dashoffset 0.9s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
        }}
        transform="rotate(-90 21 21)"
      />
    </svg>
  )
}
