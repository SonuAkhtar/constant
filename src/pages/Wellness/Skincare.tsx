import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  morningSteps,
  nightSteps,
  daytimeHabits,
  supplements,
  skinTypeGuides,
} from '../../data/skincare'
import type { SkincareStep, Supplement, SkinType } from '../../types'
import HabitForm from '../../components/HabitForm/HabitForm'
import './Skincare.css'

// ── Section icons ────────────────────────────────────────────────────────────

function SunriseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 4V2M4.4 5.6l-1.1-1.1M2 10H1M19 10h-1M15.6 5.6l1.1-1.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 13a5 5 0 0 1 10 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2" y1="16" x2="18" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="1" y1="19" x2="19" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M17 12A7 7 0 0 1 8 3a7 7 0 1 0 9 9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.1 4.1l1 1M14.9 14.9l1 1M14.9 5.1l1-1M4.1 15.9l1-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CapsuleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3" y="8" width="14" height="4" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="10" y1="8" x2="10" y2="12" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

// ── Daytime habit icons (replace emojis) ──────────────────────────────────────

function DaytimeIcon({ id }: { id: string }) {
  if (id === 'spf-reapply') return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.1 4.1l1 1M14.9 14.9l1 1M14.9 5.1l1-1M4.1 15.9l1-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
  if (id === 'no-face-touch') return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M7 9V5a1.5 1.5 0 013 0v4M10 9V4a1.5 1.5 0 013 0v5M7 9V6a1.5 1.5 0 00-3 0v4c0 4 2 7 6 7s6-3 6-7V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  if (id === 'hydration') return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2C10 2 4 9 4 13a6 6 0 0012 0C16 9 10 2 10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  if (id === 'low-gi') return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 3C10 3 7 6 6 9c-1 3 1 5 4 5s5-2 4-5c-1-3-4-6-4-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 9v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
  if (id === 'sleep') return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M17 12A7 7 0 0 1 8 3a7 7 0 1 0 9 9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
  return null
}

// ── Skin type chip icons ──────────────────────────────────────────────────────

function SkinTypeIcon({ type }: { type: string }) {
  if (type === 'oily') return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2C10 2 4 9 4 13a6 6 0 0012 0C16 9 10 2 10 2z" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </svg>
  )
  if (type === 'dry') return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2v16M7 5h6M6 9h8M7 13h6M8 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
  if (type === 'sensitive') return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2l1.5 4H16l-3.5 2.5 1.5 4L10 10l-4 2.5 1.5-4L4 6h4.5L10 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
  if (type === 'combination') return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 2" />
    </svg>
  )
  if (type === 'mature') return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 4V2M10 18v-2M4 10H2M18 10h-2M5.6 5.6l-1.4-1.4M15.8 15.8l-1.4-1.4M14.4 5.6l1.4-1.4M4.2 15.8l1.4-1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
  if (type === 'hyperpigmentation') return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
  return null
}

// ── Shared chevron ────────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={['skincare__chevron', open ? 'skincare__chevron--open' : ''].join(' ')}
      width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Evidence badge config ─────────────────────────────────────────────────────

const STRENGTH_LABEL: Record<string, string> = {
  strongest: 'Strongest evidence',
  strong: 'Strong evidence',
  moderate: 'Moderate evidence',
  emerging: 'Emerging evidence',
  insufficient: 'Insufficient evidence',
}

const STRENGTH_CLASS: Record<string, string> = {
  strongest: 'skincare__ev--strongest',
  strong: 'skincare__ev--strong',
  moderate: 'skincare__ev--moderate',
  emerging: 'skincare__ev--emerging',
  insufficient: 'skincare__ev--insufficient',
}

// ── Step card ─────────────────────────────────────────────────────────────────

function StepCard({ step, index }: { step: SkincareStep; index: number }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={['skincare__step', open ? 'skincare__step--open' : ''].join(' ')}>
      <button
        className="skincare__step-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="skincare__step-num">{index + 1}</span>
        <span className="skincare__step-title-group">
          <span className="skincare__step-name">{step.name}</span>
          {!open && <span className="skincare__step-summary">{step.summary}</span>}
        </span>
        <ChevronIcon open={open} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="skincare__step-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="skincare__step-body-inner">
              <p className="skincare__step-why">{step.why}</p>
              <div className="skincare__step-evidence">
                <span className="skincare__step-evidence-label">Evidence</span>
                <span>{step.evidence}</span>
              </div>
              <div className="skincare__step-usage">
                <span className="skincare__step-usage-label">How to use</span>
                <span>{step.usage}</span>
              </div>
              <HabitForm defaultSlot={step.timeSlot} defaultTitle={step.name}>
                <button className="skincare__add-btn" type="button">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  Add to Habits
                </button>
              </HabitForm>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Supplement card ───────────────────────────────────────────────────────────

function SupplementCard({ supp }: { supp: Supplement }) {
  const [open, setOpen] = useState(false)

  return (
    <button
      className={[
        'skincare__supp',
        !supp.recommended ? 'skincare__supp--not-recommended' : '',
        open ? 'skincare__supp--open' : '',
      ].join(' ')}
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
    >
      <div className="skincare__supp-top">
        <span className="skincare__supp-name">{supp.name}</span>
        <span className="skincare__supp-top-right">
          <span className={['skincare__ev', STRENGTH_CLASS[supp.strength]].join(' ')}>
            {STRENGTH_LABEL[supp.strength]}
          </span>
          <ChevronIcon open={open} />
        </span>
      </div>
      <span className="skincare__supp-benefit">{supp.benefit}</span>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="skincare__supp-detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            {supp.recommended && (
              <div className="skincare__supp-dose">
                <span className="skincare__supp-dose-label">Dose</span>
                <span>{supp.dose}</span>
              </div>
            )}
            <p className="skincare__supp-notes">{supp.notes}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Skincare() {
  const [skinType, setSkinType] = useState<SkinType | null>(null)
  const activeGuide = skinTypeGuides.find((g) => g.type === skinType)

  return (
    <div className="skincare">

      {/* Skin type selector */}
      <section className="skincare__section" aria-labelledby="sc-skintype-heading">
        <h2 className="skincare__section-title" id="sc-skintype-heading">Your Skin Type</h2>
        <p className="skincare__section-sub">Select yours to see personalised guidance.</p>
        <div className="skincare__skin-chips" role="group" aria-label="Skin type selection">
          {skinTypeGuides.map((guide) => (
            <button
              key={guide.type}
              className={[
                'skincare__skin-chip',
                skinType === guide.type ? 'skincare__skin-chip--active' : '',
              ].join(' ')}
              onClick={() => setSkinType(skinType === guide.type ? null : guide.type)}
              aria-pressed={skinType === guide.type}
            >
              <SkinTypeIcon type={guide.type} />
              <span>{guide.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence initial={false}>
          {activeGuide && (
            <motion.div
              className="skincare__skin-guide"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="skincare__skin-guide-inner">
                <div className="skincare__skin-guide-col">
                  <span className="skincare__skin-guide-label">Prioritise</span>
                  <ul className="skincare__skin-guide-list">
                    {activeGuide.prioritise.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="skincare__skin-guide-col">
                  <span className="skincare__skin-guide-label">Avoid</span>
                  <ul className="skincare__skin-guide-list skincare__skin-guide-list--avoid">
                    {activeGuide.avoid.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Morning routine */}
      <section className="skincare__section" aria-labelledby="sc-morning-heading">
        <div className="skincare__section-header">
          <span className="skincare__section-icon"><SunriseIcon /></span>
          <div>
            <h2 className="skincare__section-title" id="sc-morning-heading">Morning Routine</h2>
            <p className="skincare__section-sub">4 steps · ~5 minutes</p>
          </div>
        </div>
        <div className="skincare__steps">
          {morningSteps.map((step, i) => (
            <StepCard key={step.id} step={step} index={i} />
          ))}
        </div>
        <div className="skincare__principle-note">
          Less is more. You always need sunscreen. Use moisturiser if you need it, then one or two other products for specific concerns — 2025 JAAD Delphi Consensus (62 dermatologists)
        </div>
      </section>

      {/* Night routine */}
      <section className="skincare__section" aria-labelledby="sc-night-heading">
        <div className="skincare__section-header">
          <span className="skincare__section-icon"><MoonIcon /></span>
          <div>
            <h2 className="skincare__section-title" id="sc-night-heading">Night Routine</h2>
            <p className="skincare__section-sub">3 steps · ~5 minutes</p>
          </div>
        </div>
        <div className="skincare__steps">
          {nightSteps.map((step, i) => (
            <StepCard key={step.id} step={step} index={i} />
          ))}
        </div>
      </section>

      {/* Daytime habits */}
      <section className="skincare__section" aria-labelledby="sc-daytime-heading">
        <div className="skincare__section-header">
          <span className="skincare__section-icon"><SunIcon /></span>
          <div>
            <h2 className="skincare__section-title" id="sc-daytime-heading">Daytime Habits</h2>
            <p className="skincare__section-sub">Simple behaviours that compound over time</p>
          </div>
        </div>
        <ul className="skincare__daytime">
          {daytimeHabits.map((habit) => (
            <li key={habit.id} className="skincare__daytime-item">
              <span className="skincare__daytime-icon"><DaytimeIcon id={habit.id} /></span>
              <span className="skincare__daytime-text">{habit.text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Supplements */}
      <section className="skincare__section" aria-labelledby="sc-supps-heading">
        <div className="skincare__section-header">
          <span className="skincare__section-icon"><CapsuleIcon /></span>
          <div>
            <h2 className="skincare__section-title" id="sc-supps-heading">Supplements</h2>
            <p className="skincare__section-sub">Graded by evidence strength · tap to expand</p>
          </div>
        </div>
        <p className="skincare__supp-disclaimer">
          Supplements support a good routine. They do not replace topical care or SPF.
        </p>
        <div className="skincare__supps">
          {supplements.map((supp) => (
            <SupplementCard key={supp.id} supp={supp} />
          ))}
        </div>
      </section>

    </div>
  )
}
