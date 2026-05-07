/* Shared SVG icon set — replaces all emoji throughout the app */

export function SlotIcon({ slot, size = 18 }: { slot: string; size?: number }) {
  const p = { width: size, height: size, viewBox: '0 0 18 18', fill: 'none', 'aria-hidden': true as const }
  if (slot === 'morning') return (
    <svg {...p}>
      <circle cx="9" cy="9" r="2.8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 1.5V3M9 15v1.5M1.5 9H3M15 9h1.5M3.4 3.4l1.1 1.1M13.5 13.5l1.1 1.1M13.5 4.5l1.1-1.1M3.4 14.6l1.1-1.1"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
  if (slot === 'afternoon') return (
    <svg {...p}>
      <circle cx="9" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 2V4M9 14v2M2 9h2M14 9h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
  if (slot === 'evening') return (
    <svg {...p}>
      <path d="M14.5 11A6 6 0 016.5 3 6 6 0 1014.5 11z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  if (slot === 'night' || slot === 'pinned') return (
    <svg {...p}>
      <path d="M9 2l1.8 4.6H16l-4 2.9 1.5 4.5L9 11.4l-4.5 2.6 1.5-4.5-4-2.9h5.2L9 2z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
  return (
    <svg {...p}>
      <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function FlameIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
      <path d="M6 0C5 2.5 3 4 3 6.5a3 3 0 006 0C9 5.5 8 5 8 5c0 1.5-1 2-2 2C6 5 8 3 6 0z" />
    </svg>
  )
}

export function SparkleIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M11 2v3M11 17v3M2 11h3M17 11h3M4.1 4.1l2.1 2.1M15.8 15.8l2.1 2.1M15.8 6.2l2.1-2.1M4.1 17.9l2.1-2.1"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="11" cy="11" r="3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

export function TrophyIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M5 3h14v7a7 7 0 01-14 0V3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M5 6H3v3a3 3 0 003 3M19 6h2v3a3 3 0 01-3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export function StarIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 2l1.8 4.6H16l-4 2.9 1.5 4.5L9 11.4l-4.5 2.6 1.5-4.5-4-2.9h5.2L9 2z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

export function WaveIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M4 8v4a5 5 0 0010 0V8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M7 8V6a2 2 0 014 0v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M11 8V6a2 2 0 014 0v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export function FocusIcon({ id, size = 20 }: { id: string; size?: number }) {
  const s = { width: size, height: size, viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': true as const }
  const lp = { stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (id === 'health') return (
    <svg {...s}>
      <path d="M10 17S3 12.5 3 8a4 4 0 017-2.65A4 4 0 0117 8c0 4.5-7 9-7 9z" {...lp} />
    </svg>
  )
  if (id === 'mindfulness') return (
    <svg {...s}>
      <circle cx="10" cy="7.5" r="2.5" {...lp} />
      <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" {...lp} />
    </svg>
  )
  if (id === 'productivity') return (
    <svg {...s}>
      <path d="M11.5 2.5L7 10h4.5L9 17.5l8-10H12l.5-5z" {...lp} />
    </svg>
  )
  if (id === 'learning') return (
    <svg {...s}>
      <path d="M3 4h14v10H3z" {...lp} />
      <path d="M10 4v10M3 14l7 2.5 7-2.5" {...lp} />
    </svg>
  )
  if (id === 'sleep') return (
    <svg {...s}>
      <path d="M15.5 12.5A6.5 6.5 0 017 4a6.5 6.5 0 108.5 8.5z" {...lp} />
    </svg>
  )
  if (id === 'nutrition') return (
    <svg {...s}>
      <path d="M10 3c0 0-6 3.5-3.5 9C8 10 10 9 10 9v8" {...lp} />
      <path d="M10 3c0 0 6 3.5 3.5 9C12 10 10 9 10 9" {...lp} />
    </svg>
  )
  return <svg {...s}><circle cx="10" cy="10" r="6" {...lp} /></svg>
}

export function TapIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M11 3v6M8.5 5.5V11M14 7V11a5 5 0 01-10 0V5.5"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SwipeIcon({ direction = 'right', size = 22 }: { direction?: 'left' | 'right'; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
      {direction === 'right' ? (
        <path d="M4 11h14M14 7l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M18 11H4M8 7L4 11l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}
