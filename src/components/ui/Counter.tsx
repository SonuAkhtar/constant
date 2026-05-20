import { useEffect } from 'react'
import { useMotionValue, useTransform, motion, animate } from 'framer-motion'

export function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, Math.round)

  useEffect(() => {
    const controls = animate(count, to, {
      duration: 0.8,
      ease: [0, 0, 0.2, 1],
    })
    return () => controls.stop()
  }, [to, count])

  return <><motion.span>{rounded}</motion.span>{suffix}</>
}
