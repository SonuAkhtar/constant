import { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOnboardingStore } from '../../store/useOnboardingStore'
import { useHabitStore } from '../../store/useHabitStore'
import { FocusIcon, SlotIcon, TapIcon, SwipeIcon } from '../Icons'
import './Onboarding.css'

const FOCUS_OPTIONS = [
  { id: 'health',       label: 'Health'       },
  { id: 'mindfulness',  label: 'Mindfulness'  },
  { id: 'productivity', label: 'Productivity' },
  { id: 'learning',     label: 'Learning'     },
  { id: 'sleep',        label: 'Sleep'        },
  { id: 'nutrition',    label: 'Nutrition'    },
]

const STARTER_HABITS: Record<string, { title: string; icon: string; timeSlot: string }[]> = {
  health:       [{ title: 'Morning Walk', icon: 'morning', timeSlot: 'morning' }, { title: 'Drink 8 Glasses of Water', icon: 'morning', timeSlot: 'morning' }, { title: 'Sleep by 10:30pm', icon: 'night', timeSlot: 'night' }],
  mindfulness:  [{ title: '5-Min Meditation', icon: 'morning', timeSlot: 'morning' }, { title: 'Gratitude Journal', icon: 'night', timeSlot: 'night' }, { title: 'Phone-Free Morning', icon: 'morning', timeSlot: 'morning' }],
  productivity: [{ title: 'Plan Tomorrow Tonight', icon: 'night', timeSlot: 'night' }, { title: 'Read for 15 Min', icon: 'evening', timeSlot: 'evening' }, { title: 'Deep Work Block', icon: 'morning', timeSlot: 'morning' }],
  learning:     [{ title: 'Read for 20 Min', icon: 'evening', timeSlot: 'evening' }, { title: 'Listen to a Podcast', icon: 'afternoon', timeSlot: 'afternoon' }, { title: 'Practice New Skill', icon: 'morning', timeSlot: 'morning' }],
  sleep:        [{ title: 'No Screens After 10pm', icon: 'night', timeSlot: 'night' }, { title: 'Sleep by 10:30pm', icon: 'night', timeSlot: 'night' }, { title: 'Wind-Down Routine', icon: 'night', timeSlot: 'night' }],
  nutrition:    [{ title: 'Healthy Breakfast', icon: 'morning', timeSlot: 'morning' }, { title: 'Drink 8 Glasses of Water', icon: 'morning', timeSlot: 'morning' }, { title: 'Eat Dinner Before 8pm', icon: 'evening', timeSlot: 'evening' }],
}

const DEFAULT_STARTERS = [
  { title: 'Morning Walk', icon: 'morning', timeSlot: 'morning' },
  { title: 'Read for 20 Min', icon: 'evening', timeSlot: 'evening' },
  { title: 'Sleep by 10:30pm', icon: 'night', timeSlot: 'night' },
]

const STEP_LABELS = ['Focus', 'Your Name', 'First Habit', 'Quick start']

const TAGLINE = 'Build daily habits that compound into the best version of yourself.'

function WordFadeIn({ text, startDelay = 0.7 }: { text: string; startDelay?: number }) {
  const words = text.split(' ')
  return (
    <>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="onboarding__word"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: startDelay + i * 0.06, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          {word}{i < words.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </>
  )
}

const CONFETTI_COLORS = ['#c94f2a', '#e06042', '#f9c74f', '#d97706', '#90e0ef', '#c77dff']

function ConfettiBurst() {
  const particles = useMemo(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      angle: (i / 18) * 360,
      dist:  60 + Math.random() * 60,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size:  5 + Math.random() * 5,
    })), [])

  return (
    <div className="onboarding__confetti-wrap" aria-hidden="true">
      {particles.map(p => {
        const rad = (p.angle * Math.PI) / 180
        const tx  = Math.cos(rad) * p.dist
        const ty  = Math.sin(rad) * p.dist
        return (
          <motion.div
            key={p.id}
            className="onboarding__confetti-dot"
            style={{ width: p.size, height: p.size, background: p.color, borderRadius: Math.random() > 0.5 ? '50%' : '2px' }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{ x: tx, y: ty, opacity: 0, scale: 1 }}
            transition={{ duration: 0.7 + Math.random() * 0.4, ease: 'easeOut' }}
          />
        )
      })}
    </div>
  )
}

function LogoMark({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none" className="onboarding__logo-mark" aria-hidden="true">
      <rect width="30" height="30" rx="8" fill="var(--color-primary)" />
      <polyline
        points="4.5,21 9.5,14.5 13.5,17 18.5,9 25,11.5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

const slideVariants = {
  enter:  { x: '60%', opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit:   { x: '-60%', opacity: 0 },
}

const transition = { duration: 0.32, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }

export default function Onboarding() {
  const { complete }  = useOnboardingStore()
  const { addHabit }  = useHabitStore()
  const [step, setStep]         = useState(0)
  const [name, setName]         = useState('')
  const [nameError, setNameError] = useState(false)
  const [focuses, setFocuses]   = useState<string[]>([])
  const nameInputRef = useRef<HTMLInputElement>(null)

  const suggestions = useMemo(() => {
    const all = focuses.flatMap(f => STARTER_HABITS[f] ?? [])
    const unique = all.filter((h, i) => all.findIndex(x => x.title === h.title) === i)
    return unique.length >= 3 ? unique.slice(0, 3) : DEFAULT_STARTERS
  }, [focuses])

  function toggleFocus(id: string) {
    setFocuses(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])
  }

  function handleNameContinue() {
    if (!name.trim()) {
      setNameError(true)
      nameInputRef.current?.focus()
      setTimeout(() => setNameError(false), 600)
      return
    }
    setStep(3)
  }

  const [pendingName, setPendingName] = useState('')
  const [pendingFocuses, setPendingFocuses] = useState<string[]>([])
  const [showConfetti, setShowConfetti] = useState(false)

  function handlePickHabit(habit: { title: string; icon: string; timeSlot: string }) {
    addHabit({ title: habit.title, icon: habit.icon, timeSlot: habit.timeSlot as 'morning' | 'afternoon' | 'evening' | 'night' })
    setPendingName(name.trim())
    setPendingFocuses(focuses)
    setShowConfetti(true)
    setTimeout(() => {
      setShowConfetti(false)
      setStep(4)
    }, 1200)
  }

  function handleSkipHabit() {
    setPendingName(name.trim())
    setPendingFocuses(focuses)
    setStep(4)
  }

  function handleFinish() {
    complete(pendingName, pendingFocuses)
  }

  return (
    <div className="onboarding">
      {step > 0 && (
        <div className="onboarding__steps">
          {STEP_LABELS.map((label, i) => {
            const active = step - 1 === i
            const done   = step - 1 > i
            return (
              <motion.div
                key={i}
                className={['onboarding__step', active ? 'onboarding__step--active' : '', done ? 'onboarding__step--done' : ''].filter(Boolean).join(' ')}
                animate={{ width: active ? 'auto' : 10 }}
                transition={{ duration: 0.3 }}
              >
                {active && <span className="onboarding__step-label">{label}</span>}
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence mode="wait">

        {step === 0 && (
          <motion.div
            key="welcome"
            className="onboarding__screen"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
              className="onboarding__logo-wrap"
            >
              <LogoMark size={80} />
              <motion.div
                className="onboarding__logo-glow"
                animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.18, 0.35] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="onboarding__text"
            >
              <h1 className="onboarding__title">Best of Me</h1>
              <p className="onboarding__subtitle">
                <WordFadeIn text={TAGLINE} startDelay={0.7} />
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="onboarding__actions"
            >
              <button className="onboarding__btn onboarding__btn--primary" onClick={() => setStep(1)}>
                Get Started
              </button>
            </motion.div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="focus"
            className="onboarding__screen"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
          >
            <div className="onboarding__text">
              <h2 className="onboarding__title onboarding__title--md">
                What do you want<br />to improve?
              </h2>
              <p className="onboarding__subtitle">Choose anything that resonates. You can change this later.</p>
            </div>

            <div className="onboarding__focuses">
              {FOCUS_OPTIONS.map(({ id, label }) => (
                <motion.button
                  key={id}
                  className={['onboarding__focus', focuses.includes(id) ? 'onboarding__focus--active' : ''].join(' ')}
                  onClick={() => toggleFocus(id)}
                  animate={{ scale: focuses.includes(id) ? 1.04 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <span className="onboarding__focus-icon"><FocusIcon id={id} size={22} /></span>
                  <span className="onboarding__focus-label">{label}</span>
                </motion.button>
              ))}
            </div>

            <div className="onboarding__actions">
              <button
                className="onboarding__btn onboarding__btn--primary"
                onClick={() => setStep(2)}
              >
                {focuses.length > 0 ? `Continue (${focuses.length} selected)` : 'Skip for now'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="name"
            className="onboarding__screen"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
          >
            <div className="onboarding__text">
              <h2 className="onboarding__title onboarding__title--md">What should<br />we call you?</h2>
              <p className="onboarding__subtitle">We'll personalise your daily greeting.</p>
            </div>

            <div className="onboarding__field">
              <input
                ref={nameInputRef}
                className={['onboarding__input', nameError ? 'onboarding__input--error' : ''].join(' ')}
                type="text"
                placeholder="Your first name"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleNameContinue()}
                maxLength={30}
                autoFocus
              />
            </div>

            <div className="onboarding__actions">
              <button className="onboarding__btn onboarding__btn--primary" onClick={handleNameContinue}>
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="starter"
            className="onboarding__screen"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
          >
            <div className="onboarding__text">
              <h2 className="onboarding__title onboarding__title--md">
                Pick your first<br />habit{name ? `, ${name.trim()}` : ''}.
              </h2>
              <p className="onboarding__subtitle">Start with one. You can add more anytime.</p>
            </div>

            <div className="onboarding__starters" style={{ position: 'relative' }}>
              {showConfetti && <ConfettiBurst />}
              {suggestions.map((habit, i) => (
                <motion.button
                  key={habit.title}
                  className="onboarding__starter"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => handlePickHabit(habit)}
                  disabled={showConfetti}
                >
                  <span className="onboarding__starter-icon"><SlotIcon slot={habit.timeSlot} size={20} /></span>
                  <div className="onboarding__starter-body">
                    <p className="onboarding__starter-title">{habit.title}</p>
                    <p className="onboarding__starter-time">{habit.timeSlot}</p>
                  </div>
                  <span className="onboarding__starter-arrow">→</span>
                </motion.button>
              ))}
            </div>

            <div className="onboarding__actions">
              <button className="onboarding__btn onboarding__btn--ghost" onClick={handleSkipHabit}>
                I'll set up habits myself
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="orientation"
            className="onboarding__screen"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
          >
            <div className="onboarding__text">
              <h2 className="onboarding__title onboarding__title--md">Here's how<br />it works.</h2>
              <p className="onboarding__subtitle">Three gestures. That's all you need.</p>
            </div>

            <div className="onboarding__gestures">
              {[
                { icon: <TapIcon size={22} />, label: 'Tap to complete', sub: 'Mark a habit done for today' },
                { icon: <SwipeIcon direction="right" size={22} />, label: 'Swipe right', sub: 'Quick-complete with a gesture' },
                { icon: <SwipeIcon direction="left" size={22} />, label: 'Swipe left', sub: 'Edit or skip a habit' },
              ].map(({ icon, label, sub }) => (
                <div key={label} className="onboarding__gesture-card">
                  <span className="onboarding__gesture-icon">{icon}</span>
                  <div className="onboarding__gesture-body">
                    <p className="onboarding__gesture-label">{label}</p>
                    <p className="onboarding__gesture-sub">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="onboarding__actions">
              <button className="onboarding__btn onboarding__btn--primary" onClick={handleFinish}>
                Let's go →
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
