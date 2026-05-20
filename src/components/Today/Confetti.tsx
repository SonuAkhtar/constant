import { useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'

const CONFETTI_COLORS = [
  '#c94f2a', '#6366f1', '#f97316', '#22c55e',
  '#c084fc', '#22d3ee', '#f59e0b', '#818cf8',
]

export function Confetti({ onDone }: { onDone: () => void }) {
  const reducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        x: (Math.random() - 0.5) * 340,
        y: Math.random() * 300 + 80,
        rotate: Math.random() * 640 - 320,
        delay: i * 0.036,
        duration: 1.0 + Math.random() * 0.6,
        w: 6 + Math.floor(Math.random() * 7),
        h: 4 + Math.floor(Math.random() * 5),
        round: Math.random() > 0.5,
      })),
    [],
  )

  useEffect(() => {
    const delay = reducedMotion ? 0 : 2600
    const id = setTimeout(onDone, delay)
    return () => clearTimeout(id)
  }, [onDone, reducedMotion])

  if (reducedMotion) return null

  return (
    <div className="today__confetti" aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="today__confetti-particle"
          style={{
            backgroundColor: p.color,
            width: p.w,
            height: p.h,
            borderRadius: p.round ? '50%' : '2px',
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate, scale: 0.3 }}
          transition={{ duration: p.duration, delay: p.delay, ease: [0.2, 0.8, 0.4, 1] }}
        />
      ))}
    </div>
  )
}
