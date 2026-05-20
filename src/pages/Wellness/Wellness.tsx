import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Skincare from './Skincare'
import Workout from './Workout'
import './Wellness.css'

type WellnessTab = 'skincare' | 'workout'

function SkincareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2C8 2 4 6 4 9.5a4 4 0 008 0C12 6 8 2 8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 9.5c0 1 .7 1.5 1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function WorkoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M9 2L4.5 8.5H8L7 14l6.5-8H10L11.5 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const TABS: { id: WellnessTab; label: string; Icon: () => React.JSX.Element }[] = [
  { id: 'skincare', label: 'Skincare', Icon: SkincareIcon },
  { id: 'workout',  label: 'Workout',  Icon: WorkoutIcon  },
]

export default function Wellness() {
  const [tab, setTab] = useState<WellnessTab>('skincare')

  function handleTab(next: WellnessTab) {
    if (next !== tab) setTab(next)
  }

  return (
    <div className="wellness-page">
      <h1 className="wellness-page__heading">Wellness</h1>

      <div className="wellness-page__tab-bar" role="tablist" aria-label="Wellness sections">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            role="tab"
            id={`wellness-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`wellness-panel-${id}`}
            className={['wellness-page__tab', tab === id ? 'wellness-page__tab--active' : ''].join(' ')}
            onClick={() => handleTab(id)}
          >
            {tab === id && (
              <motion.div
                layoutId="wellness-pill"
                className="wellness-page__tab-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="wellness-page__tab-icon"><Icon /></span>
            <span className="wellness-page__tab-label">{label}</span>
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`wellness-panel-${tab}`}
        aria-labelledby={`wellness-tab-${tab}`}
        className="wellness-page__panel"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          >
            {tab === 'skincare' ? <Skincare /> : <Workout />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
