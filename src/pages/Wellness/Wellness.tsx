import React, { Component, useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import Skincare from './Skincare'
import Workout from './Workout'
import './Wellness.css'

type WellnessTab = 'skincare' | 'workout'

class SubAppErrorBoundary extends Component<
  { children: ReactNode; onRetry: () => void },
  { error: Error | null }
> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('[Wellness sub-app] render error', error)
  }
  render() {
    if (this.state.error) {
      return (
        <div className="wellness-page__error" role="alert">
          <p className="wellness-page__error-title">Something hiccupped.</p>
          <p className="wellness-page__error-sub">Try switching tabs again.</p>
          <button
            type="button"
            className="wellness-page__error-btn"
            onClick={() => {
              this.setState({ error: null })
              this.props.onRetry()
            }}
          >
            Reload this section
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

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

  const [reloadKey, setReloadKey] = useState(0)

  function handleTab(next: WellnessTab) {
    if (next !== tab) setTab(next)
  }

  return (
    <div className="wellness-page">
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
        <motion.div
          key={`${tab}-${reloadKey}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
        >
          <SubAppErrorBoundary onRetry={() => setReloadKey((k) => k + 1)}>
            {tab === 'skincare' ? <Skincare /> : <Workout />}
          </SubAppErrorBoundary>
        </motion.div>
      </div>
    </div>
  )
}
