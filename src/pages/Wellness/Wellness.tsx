import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Skincare from './Skincare'
import Workout from './Workout'
import './Wellness.css'

type WellnessTab = 'skincare' | 'workout'

const TABS: { id: WellnessTab; label: string }[] = [
  { id: 'skincare', label: 'Skincare' },
  { id: 'workout',  label: 'Workout'  },
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
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            id={`wellness-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`wellness-panel-${id}`}
            className={['wellness-page__tab', tab === id ? 'wellness-page__tab--active' : ''].join(' ')}
            onClick={() => handleTab(id)}
          >
            {label}
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
