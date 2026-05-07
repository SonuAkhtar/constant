import { useState, useMemo, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence, useDragControls, type PanInfo } from 'framer-motion'
import { useHabitStore } from '../../store/useHabitStore'
import { SlotIcon } from '../Icons'
import type { Habit, TimeSlot, HabitFrequency } from '../../types'
import './HabitForm.css'

const SLOT_OPTIONS: { slot: TimeSlot; label: string }[] = [
  { slot: 'morning',   label: 'Morning'   },
  { slot: 'afternoon', label: 'Afternoon' },
  { slot: 'evening',   label: 'Evening'   },
  { slot: 'night',     label: 'Night'     },
]

const FREQ_OPTIONS: { value: HabitFrequency; label: string }[] = [
  { value: 'daily',    label: 'Every day' },
  { value: 'weekdays', label: 'Weekdays'  },
  { value: 'custom',   label: 'Custom'    },
]

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

interface Props {
  defaultSlot: TimeSlot
  habit?: Habit
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function HabitForm({ defaultSlot, habit, children, open: openProp, onOpenChange }: Props) {
  const { addHabit, editHabit, habits } = useHabitStore()
  const isEditMode = !!habit

  const [openInternal, setOpenInternal] = useState(false)
  const open = openProp !== undefined ? openProp : openInternal
  const dragControls = useDragControls()

  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [intention,   setIntention]   = useState('')
  const [timeSlot,    setTimeSlot]    = useState<TimeSlot>(defaultSlot)
  const [frequency,   setFrequency]   = useState<HabitFrequency>('daily')
  const [customDays,  setCustomDays]  = useState<number[]>([1, 2, 3, 4, 5])
  const [reminderTime, setReminderTime] = useState<string>('')
  const [shaking,     setShaking]     = useState(false)

  useEffect(() => {
    if (open) {
      setTitle(habit?.title ?? '')
      setDescription(habit?.description ?? '')
      setIntention(habit?.intention ?? '')
      setTimeSlot(habit?.timeSlot ?? defaultSlot)
      setFrequency(habit?.frequency ?? 'daily')
      setCustomDays(habit?.customDays ?? [1, 2, 3, 4, 5])
      setReminderTime(habit?.reminderTime ?? '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const isDuplicateName = useMemo(() => {
    const trimmed = title.trim().toLowerCase()
    if (!trimmed) return false
    return habits.some(h => h.id !== habit?.id && h.title.trim().toLowerCase() === trimmed)
  }, [title, habits, habit?.id])

  function handleOpenChange(next: boolean) {
    if (onOpenChange) {
      onOpenChange(next)
    } else {
      setOpenInternal(next)
    }
    if (next) {
      setTitle(habit?.title ?? '')
      setDescription(habit?.description ?? '')
      setIntention(habit?.intention ?? '')
      setTimeSlot(habit?.timeSlot ?? defaultSlot)
      setFrequency(habit?.frequency ?? 'daily')
      setCustomDays(habit?.customDays ?? [1, 2, 3, 4, 5])
      setReminderTime(habit?.reminderTime ?? '')
    }
  }

  function toggleDay(day: number) {
    setCustomDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setShaking(true)
      navigator.vibrate?.(20)
      setTimeout(() => setShaking(false), 400)
      return
    }
    const payload: Omit<Habit, 'id' | 'isCustom'> = {
      title:       title.trim(),
      description: description.trim() || undefined,
      intention:   intention.trim() || undefined,
      timeSlot,
      icon:        timeSlot,
      frequency,
      customDays:  frequency === 'custom' ? customDays : undefined,
      reminderTime: reminderTime || undefined,
    }
    if (isEditMode && habit) {
      editHabit(habit.id, payload)
    } else {
      addHabit(payload)
    }
    handleOpenChange(false)
  }

  function handlePanelDragEnd(_: PointerEvent, info: PanInfo) {
    if (info.velocity.y > 400 || info.offset.y > 150) {
      handleOpenChange(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>

      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="habit-form__overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                className="habit-form__panel"
                initial={{ opacity: 0, y: 32, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.97 }}
                transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                drag="y"
                dragControls={dragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.45 }}
                onDragEnd={handlePanelDragEnd}
              >
                <div
                  className="habit-form__handle"
                  onPointerDown={e => dragControls.start(e)}
                />

                <div className="habit-form__header">
                  <Dialog.Title className="habit-form__title">
                    {isEditMode ? 'Edit Habit' : 'New Habit'}
                  </Dialog.Title>
                  <Dialog.Close className="habit-form__close" aria-label="Close">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </Dialog.Close>
                </div>

                <form id="habit-form" className="habit-form__body" onSubmit={handleSubmit}>

                  <div className="habit-form__field">
                    <div className="habit-form__label-row">
                      <label className="habit-form__label" htmlFor="habit-title">Name</label>
                      <span className="habit-form__char-count">{title.length}/60</span>
                    </div>
                    <input
                      id="habit-title"
                      className="habit-form__input"
                      type="text"
                      placeholder="e.g. Meditate for 10 min"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      autoFocus
                      maxLength={60}
                    />
                    {isDuplicateName && (
                      <p className="habit-form__duplicate-warning">
                        You already have a habit called this.
                      </p>
                    )}
                  </div>

                  <div className="habit-form__field">
                    <div className="habit-form__label-row">
                      <label className="habit-form__label" htmlFor="habit-desc">
                        Description <span className="habit-form__optional">(optional)</span>
                      </label>
                      <span className="habit-form__char-count">{description.length}/80</span>
                    </div>
                    <input
                      id="habit-desc"
                      className="habit-form__input"
                      type="text"
                      placeholder="Short note or target"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      maxLength={80}
                    />
                  </div>

                  <div className="habit-form__field">
                    <div className="habit-form__label-row">
                      <label className="habit-form__label" htmlFor="habit-intention">
                        Your why <span className="habit-form__optional">(optional)</span>
                      </label>
                      <span className="habit-form__char-count">{intention.length}/100</span>
                    </div>
                    <input
                      id="habit-intention"
                      className="habit-form__input"
                      type="text"
                      placeholder="e.g. I want more energy for my family"
                      value={intention}
                      onChange={e => setIntention(e.target.value)}
                      maxLength={100}
                    />
                  </div>

                  <div className="habit-form__field">
                    <label className="habit-form__label">Time of day</label>
                    <div className="habit-form__slots">
                      {SLOT_OPTIONS.map(({ slot, label }) => (
                        <button
                          key={slot}
                          type="button"
                          className={['habit-form__slot', timeSlot === slot ? 'habit-form__slot--active' : ''].join(' ')}
                          onClick={() => setTimeSlot(slot)}
                        >
                          <span className="habit-form__slot-icon"><SlotIcon slot={slot} size={14} /></span>
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="habit-form__field">
                    <label className="habit-form__label">Repeat</label>
                    <div className="habit-form__freq-pills">
                      {FREQ_OPTIONS.map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          className={['habit-form__freq-pill', frequency === value ? 'habit-form__freq-pill--active' : ''].join(' ')}
                          onClick={() => setFrequency(value)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {frequency === 'custom' && (
                      <div className="habit-form__days">
                        {DAY_LABELS.map((d, i) => (
                          <button
                            key={i}
                            type="button"
                            className={['habit-form__day', customDays.includes(i) ? 'habit-form__day--active' : ''].join(' ')}
                            onClick={() => toggleDay(i)}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="habit-form__field">
                    <label className="habit-form__label" htmlFor="habit-time">
                      Reminder <span className="habit-form__optional">(optional)</span>
                    </label>
                    <input
                      id="habit-time"
                      className="habit-form__input habit-form__time-input"
                      type="time"
                      value={reminderTime}
                      onChange={e => setReminderTime(e.target.value)}
                    />
                    {reminderTime && (
                      <button
                        type="button"
                        className="habit-form__time-clear"
                        onClick={() => setReminderTime('')}
                      >
                        Remove reminder
                      </button>
                    )}
                  </div>

                </form>

                <div className="habit-form__footer">
                  <button
                    type="submit"
                    form="habit-form"
                    className={['habit-form__submit', shaking ? 'habit-form__submit--shake' : ''].join(' ')}
                  >
                    {isEditMode ? 'Save Changes' : 'Add Habit'}
                  </button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
