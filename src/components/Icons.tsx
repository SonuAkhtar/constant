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

export const HABIT_ICON_OPTIONS: { key: string; label: string }[] = [
  { key: 'water',    label: 'Water'    },
  { key: 'run',      label: 'Run'      },
  { key: 'gym',      label: 'Gym'      },
  { key: 'meditate', label: 'Meditate' },
  { key: 'book',     label: 'Read'     },
  { key: 'sleep',    label: 'Sleep'    },
  { key: 'coffee',   label: 'Coffee'   },
  { key: 'meal',     label: 'Eat'      },
  { key: 'music',    label: 'Music'    },
  { key: 'journal',  label: 'Journal'  },
  { key: 'heart',    label: 'Health'   },
  { key: 'bike',     label: 'Bike'     },
  { key: 'medicine', label: 'Medicine' },
  { key: 'plant',    label: 'Nature'   },
  { key: 'focus',    label: 'Focus'    },
  { key: 'stretch',  label: 'Stretch'  },
]

export function HabitIcon({ icon, size = 20 }: { icon: string; size?: number }) {
  if (icon === 'morning' || icon === 'afternoon' || icon === 'evening' || icon === 'night') {
    return <SlotIcon slot={icon} size={size} />
  }
  const p = { width: size, height: size, viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': true as const }
  const lp = { stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (icon) {
    case 'water': return (
      <svg {...p}><path d="M10 3C8 6 4 10 4 13.5a6 6 0 0012 0C16 10 12 6 10 3Z" {...lp} /></svg>
    )
    case 'run': return (
      <svg {...p}>
        <circle cx="13.5" cy="3.5" r="1.5" fill="currentColor" />
        <path d="M12 5l-2 4.5-2.5 5M12 5l1 4 2.5 4.5M12 5l-3 2.5M12 5l2.5 1.5" {...lp} />
      </svg>
    )
    case 'gym': return (
      <svg {...p}><path d="M4 10h12M5 7.5v5M15 7.5v5M3 8.5v3M17 8.5v3" {...lp} /></svg>
    )
    case 'meditate': return (
      <svg {...p}>
        <circle cx="10" cy="4" r="1.8" {...lp} />
        <path d="M7.5 10c0-1 1.2-2.5 2.5-2.5S12.5 9 12.5 10l-1 6.5h-3L7.5 10zM5.5 12c0-1 2-1.5 2-1.5M14.5 12c0-1-2-1.5-2-1.5" {...lp} />
      </svg>
    )
    case 'book': return (
      <svg {...p}>
        <path d="M3 5h7v12H3V5zM10 5h7v12h-7V5zM10 5v12" {...lp} />
        <path d="M3 5l7-1.5 7 1.5" {...lp} />
      </svg>
    )
    case 'sleep': return (
      <svg {...p}><path d="M15 13.5A7 7 0 015.5 4 7 7 0 1015 13.5z" {...lp} /></svg>
    )
    case 'coffee': return (
      <svg {...p}>
        <path d="M4 8h9v5.5a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" {...lp} />
        <path d="M13 10h2.5a1.5 1.5 0 010 3H13" {...lp} />
        <path d="M7 5c-.5-1 .5-2 .5-2M10.5 4.5c-.5-1 .5-2 .5-2" {...lp} />
      </svg>
    )
    case 'meal': return (
      <svg {...p}><path d="M6.5 2v7M5 2v4a1.5 1.5 0 003 0V2M14.5 2v16M12.5 2v5a2 2 0 004 0V2" {...lp} /></svg>
    )
    case 'music': return (
      <svg {...p}>
        <path d="M8 16V6.5l8-2.5v9" {...lp} />
        <circle cx="6" cy="16" r="2.5" {...lp} />
        <circle cx="14" cy="13.5" r="2.5" {...lp} />
      </svg>
    )
    case 'journal': return (
      <svg {...p}>
        <rect x="3.5" y="2.5" width="11" height="15" rx="1.5" {...lp} />
        <path d="M6.5 7h5M6.5 10h5M6.5 13h3.5" {...lp} />
        <path d="M13.5 13.5l2.5-2.5 1 1-2.5 2.5-1-1z" {...lp} />
      </svg>
    )
    case 'heart': return (
      <svg {...p}><path d="M10 16.5C4 12.5 2 7 2.5 5.5A4.5 4.5 0 0110 4a4.5 4.5 0 017.5 1.5C18 7 16 12.5 10 16.5Z" {...lp} /></svg>
    )
    case 'bike': return (
      <svg {...p}>
        <circle cx="5.5" cy="13.5" r="3.5" {...lp} />
        <circle cx="14.5" cy="13.5" r="3.5" {...lp} />
        <path d="M5.5 13.5L10 7l4.5 6.5M10 7l2.5-3" {...lp} />
        <circle cx="12.5" cy="4" r="1" fill="currentColor" />
      </svg>
    )
    case 'medicine': return (
      <svg {...p}>
        <rect x="4" y="7.5" width="12" height="6" rx="3" {...lp} />
        <path d="M10 7.5v6" {...lp} />
      </svg>
    )
    case 'plant': return (
      <svg {...p}>
        <path d="M10 17V9" {...lp} />
        <path d="M10 9C10 9 4 7 4.5 2.5c0 0 6 .5 5.5 6.5z" {...lp} />
        <path d="M10 12.5c0 0 5.5-1 5.5-5.5 0 0-6 0-5.5 5.5z" {...lp} />
      </svg>
    )
    case 'focus': return (
      <svg {...p}>
        <circle cx="10" cy="10" r="8" {...lp} />
        <circle cx="10" cy="10" r="4.5" {...lp} />
        <circle cx="10" cy="10" r="1.5" fill="currentColor" />
      </svg>
    )
    case 'stretch': return (
      <svg {...p}>
        <circle cx="10" cy="3.5" r="1.5" {...lp} />
        <path d="M10 5.5v7.5M7 8l3 1.5 3-1.5M10 13l-2.5 4M10 13l2.5 4" {...lp} />
      </svg>
    )
    default: return <SlotIcon slot="morning" size={size} />
  }
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
