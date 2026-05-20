import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrophyIcon } from '../Icons'
import { haptic } from '../../utils/haptic'
import type { Milestone } from '../../types'

export function MilestoneOverlay({
  milestone,
  onDone,
}: {
  milestone: Milestone
  onDone: () => void
}) {
  useEffect(() => {
    haptic('celebration')
    const id = setTimeout(onDone, 3000)
    return () => clearTimeout(id)
  }, [onDone])

  return (
    <motion.div
      className="today__milestone-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onDone}
    >
      <motion.div
        className="today__milestone-card"
        initial={{ scale: 0.85, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      >
        <span className="today__milestone-icon">
          <TrophyIcon size={48} />
        </span>
        <p className="today__milestone-message">{milestone.message}</p>
        <p className="today__milestone-tap">Tap to continue</p>
      </motion.div>
    </motion.div>
  )
}
