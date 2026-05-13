import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { workoutDays, beginnerDays, workoutPrinciples, nutritionTips } from '../../data/workout'
import { useWorkoutStore } from '../../store/useWorkoutStore'
import type { Exercise, ExperienceLevel } from '../../types'
import './Workout.css'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const LEVELS: { id: ExperienceLevel; label: string; sub: string }[] = [
  { id: 'beginner',     label: 'Beginner',     sub: '3 days · Full body'  },
  { id: 'intermediate', label: 'Intermediate', sub: '6 days · Push Pull Legs' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseRestSeconds(rest: string): number {
  if (rest === '—') return 0
  const minMatch = rest.match(/(\d+)(?:[–-]\d+)?\s*min/)
  if (minMatch) return parseInt(minMatch[1]) * 60
  const secMatch = rest.match(/(\d+)(?:[–-]\d+)?\s*sec/)
  if (secMatch) return parseInt(secMatch[1])
  return 0
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function getOverloadIncrement(name: string): number {
  const lower = name.toLowerCase()
  const isLower = ['squat', 'deadlift', 'hip thrust', 'lunge', 'leg press', 'calf'].some((k) => lower.includes(k))
  const isCompound = ['press', 'row', 'pull-up', 'pulldown', 'curl', 'extension', 'pushdown'].some((k) => lower.includes(k))
  if (isLower) return 2.5
  if (isCompound) return 1.25
  return 0
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function NutritionIcon({ id }: { id: string }) {
  if (id === 'protein') return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 10a6 6 0 0012 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 10V6M13 10V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4 6h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
  if (id === 'creatine') return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 3l2.5 5H17l-4 3 1.5 5L10 13l-4.5 3L7 11 3 8h4.5L10 3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  )
  if (id === 'caffeine') return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M6 4h8l-1 9H7L6 4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M14 7h2a2 2 0 010 4h-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M5 16h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
  if (id === 'timing') return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="11" r="7" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M10 7v4l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 2h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
  if (id === 'hydration') return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2C10 2 4 9.5 4 13a6 6 0 0012 0C16 9.5 10 2 10 2z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  if (id === 'sleep') return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M17 12A7 7 0 0 1 8 3a7 7 0 1 0 9 9z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  )
  return null
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={['workout__chevron', open ? 'workout__chevron--open' : ''].join(' ')}
      width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TimerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="8" r="5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 5.5V8l1.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5.5 1.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

// ── Exercise row ──────────────────────────────────────────────────────────────

function ExerciseRow({ exercise }: { exercise: Exercise }) {
  const { weights, setWeight } = useWorkoutStore()
  const savedWeight = weights[exercise.id] ?? 0

  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [localWeight, setLocalWeight] = useState(savedWeight > 0 ? savedWeight.toString() : '')

  const restSeconds = parseRestSeconds(exercise.rest)
  const [timerLeft, setTimerLeft] = useState(restSeconds)
  const [timerActive, setTimerActive] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!open) {
      setTimerActive(false)
      setTimerLeft(restSeconds)
    }
  }, [open, restSeconds])

  useEffect(() => {
    if (!timerActive) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setTimerLeft((s) => {
        if (s <= 1) {
          setTimerActive(false)
          navigator.vibrate?.([120, 60, 120])
          return restSeconds
        }
        return s - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [timerActive, restSeconds])

  function handleWeightBlur() {
    const n = parseFloat(localWeight)
    if (!isNaN(n) && n > 0) setWeight(exercise.id, n)
  }

  const increment = getOverloadIncrement(exercise.name)
  const timerPercent = restSeconds > 0 ? ((restSeconds - timerLeft) / restSeconds) * 100 : 0

  return (
    <div
      className={['workout__exercise', open ? 'workout__exercise--open' : '', done ? 'workout__exercise--done' : ''].join(' ')}
    >
      <button
        className="workout__exercise-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`${exercise.name}, ${exercise.sets} sets of ${exercise.reps}`}
      >
        <div className="workout__exercise-main">
          <span className="workout__exercise-name">{exercise.name}</span>
          <span className="workout__exercise-meta" aria-hidden="true">
            {exercise.sets} × {exercise.reps} · {exercise.rest}
          </span>
        </div>
        {done && <span className="workout__done-badge" aria-label="Completed">✓</span>}
        <ChevronIcon open={open} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="workout__exercise-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="workout__exercise-body-inner">

              <div className="workout__exercise-row">
                <span className="workout__exercise-row-label">Muscles</span>
                <span>{exercise.muscles}</span>
              </div>

              {exercise.cue && (
                <div className="workout__exercise-row workout__exercise-cue">
                  <span className="workout__exercise-row-label">Coaching cue</span>
                  <span>{exercise.cue}</span>
                </div>
              )}

              {exercise.rest !== '—' && (
                <div className="workout__tracker">
                  <div className="workout__tracker-weight">
                    <span className="workout__tracker-label" id={`weight-label-${exercise.id}`}>Weight</span>
                    <div className="workout__weight-input-row">
                      <input
                        className="workout__weight-input"
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="0"
                        value={localWeight}
                        onChange={(e) => setLocalWeight(e.target.value)}
                        onBlur={handleWeightBlur}
                        aria-labelledby={`weight-label-${exercise.id}`}
                        aria-label="Weight in kg"
                      />
                      <span className="workout__weight-unit" aria-hidden="true">kg</span>
                    </div>
                    {done && savedWeight > 0 && (
                      <span className="workout__overload-hint" role="status">
                        {increment > 0 ? `+${increment}kg next session` : '+1 rep next session'}
                      </span>
                    )}
                  </div>

                  <button
                    className={['workout__done-btn', done ? 'workout__done-btn--done' : ''].join(' ')}
                    onClick={() => setDone((d) => !d)}
                    aria-pressed={done}
                  >
                    {done ? '✓ Done' : 'Mark Done'}
                  </button>
                </div>
              )}

              {restSeconds > 0 && (
                <div className="workout__timer" role="region" aria-label="Rest timer">
                  <div className="workout__timer-top">
                    <span className="workout__tracker-label">Rest Timer</span>
                    <span
                      className={['workout__timer-display', timerActive ? 'workout__timer-display--active' : ''].join(' ')}
                      role="timer"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {formatTime(timerLeft)}
                    </span>
                  </div>
                  {timerActive && (
                    <div className="workout__timer-bar" role="progressbar" aria-valuenow={timerPercent} aria-valuemin={0} aria-valuemax={100}>
                      <motion.div
                        className="workout__timer-bar-fill"
                        initial={{ width: '0%' }}
                        animate={{ width: `${timerPercent}%` }}
                        transition={{ duration: 0.9, ease: 'linear' }}
                      />
                    </div>
                  )}
                  <div className="workout__timer-actions">
                    {!timerActive ? (
                      <button
                        className="workout__timer-btn workout__timer-btn--start"
                        onClick={() => { setTimerLeft(restSeconds); setTimerActive(true) }}
                        aria-label={`Start rest timer for ${exercise.rest}`}
                      >
                        <TimerIcon />
                        Start {exercise.rest}
                      </button>
                    ) : (
                      <button
                        className="workout__timer-btn workout__timer-btn--stop"
                        onClick={() => { setTimerActive(false); setTimerLeft(restSeconds) }}
                        aria-label="Stop rest timer"
                      >
                        Stop
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Day view ──────────────────────────────────────────────────────────────────

function DayView({ workoutDay }: { workoutDay: (typeof workoutDays)[number] }) {
  return (
    <div className="workout__day-view">
      <div className="workout__day-header">
        <div>
          <h3 className="workout__day-label">{workoutDay.label}</h3>
          <p className="workout__day-focus">{workoutDay.focus}</p>
        </div>
        {workoutDay.isRest && <span className="workout__rest-badge">Rest Day</span>}
      </div>
      <p className="workout__day-summary">{workoutDay.summary}</p>
      <div className="workout__exercises">
        {workoutDay.exercises.map((ex) => (
          <ExerciseRow key={ex.id} exercise={ex} />
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Workout() {
  const { level, setLevel } = useWorkoutStore()
  const todayIndex = (new Date().getDay() + 6) % 7
  const [selectedDay, setSelectedDay] = useState(todayIndex)
  const [principlesOpen, setPrinciplesOpen] = useState(false)
  const [nutritionOpen, setNutritionOpen] = useState(false)

  const days = level === 'beginner' ? beginnerDays : workoutDays
  const currentWorkout = days[selectedDay]

  function handleLevelChange(next: ExperienceLevel) {
    if (next !== level) {
      setLevel(next)
      setSelectedDay(todayIndex)
    }
  }

  return (
    <div className="workout">

      {/* Experience level selector */}
      <div className="workout__level" role="group" aria-label="Experience level">
        {LEVELS.map(({ id, label, sub }) => (
          <button
            key={id}
            className={['workout__level-chip', level === id ? 'workout__level-chip--active' : ''].join(' ')}
            onClick={() => handleLevelChange(id)}
            aria-pressed={level === id}
          >
            <span className="workout__level-label">{label}</span>
            <span className="workout__level-sub">{sub}</span>
          </button>
        ))}
      </div>

      {level === 'beginner' && (
        <div className="workout__beginner-note">
          Designed for trainees with fewer than 3–6 months of consistent training. Focus on movement quality over load. Graduate to Intermediate when all sets feel comfortable with good form.
        </div>
      )}

      {/* Day schedule strip */}
      <div className="workout__strip" role="group" aria-label="Select training day">
        {DAY_LABELS.map((label, i) => {
          const wd = days[i]
          return (
            <button
              key={label}
              className={[
                'workout__day-chip',
                selectedDay === i ? 'workout__day-chip--active' : '',
                wd.isRest ? 'workout__day-chip--rest' : '',
              ].join(' ')}
              onClick={() => setSelectedDay(i)}
              aria-pressed={selectedDay === i}
              aria-label={`${label}: ${wd.label}`}
            >
              <span className="workout__day-chip-label">{label}</span>
              <span className="workout__day-chip-tag">{wd.isRest ? 'Rest' : wd.label}</span>
            </button>
          )
        })}
      </div>

      {/* Day card with transition */}
      <div className="workout__card">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${level}-${selectedDay}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
          >
            <DayView workoutDay={currentWorkout} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Training principles panel */}
      <div className="workout__panel">
        <button
          className="workout__panel-header"
          onClick={() => setPrinciplesOpen((o) => !o)}
          aria-expanded={principlesOpen}
          aria-controls="workout-principles-body"
        >
          <span className="workout__panel-title">Training Principles</span>
          <ChevronIcon open={principlesOpen} />
        </button>
        <AnimatePresence initial={false}>
          {principlesOpen && (
            <motion.div
              id="workout-principles-body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="workout__panel-body"
            >
              <div className="workout__principles">
                {workoutPrinciples.map((p) => (
                  <div key={p.id} className="workout__principle">
                    <span className="workout__principle-title">{p.title}</span>
                    <p className="workout__principle-body">{p.body}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nutrition & recovery panel */}
      <div className="workout__panel">
        <button
          className="workout__panel-header"
          onClick={() => setNutritionOpen((o) => !o)}
          aria-expanded={nutritionOpen}
          aria-controls="workout-nutrition-body"
        >
          <span className="workout__panel-title">Nutrition & Recovery</span>
          <ChevronIcon open={nutritionOpen} />
        </button>
        <AnimatePresence initial={false}>
          {nutritionOpen && (
            <motion.div
              id="workout-nutrition-body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="workout__panel-body"
            >
              <div className="workout__nutrition">
                {nutritionTips.map((tip) => (
                  <div key={tip.id} className="workout__nutrition-item">
                    <span className="workout__nutrition-icon" aria-hidden="true"><NutritionIcon id={tip.id} /></span>
                    <div className="workout__nutrition-content">
                      <span className="workout__nutrition-label">{tip.label}</span>
                      <span className="workout__nutrition-value">{tip.value}</span>
                      <p className="workout__nutrition-detail">{tip.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}
