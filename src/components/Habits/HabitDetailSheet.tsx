import { useMemo, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence, useDragControls, type PanInfo } from 'framer-motion'
import { useHabitStore } from '../../store/useHabitStore'
import { HabitIcon, FlameIcon } from '../Icons'
import type { Habit } from '../../types'
import './HabitDetailSheet.css'

type DotStatus = 'done' | 'skip' | 'miss'

function Dot({ status }: { status: DotStatus }) {
  return <div className={`hds__dot hds__dot--${status}`} aria-hidden="true" />
}

interface Props {
  habit: Habit | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
  onArchive: () => void
}

export function HabitDetailSheet({ habit, open, onOpenChange, onEdit, onArchive }: Props) {
  const getHabitStats = useHabitStore(s => s.getHabitStats)

  const lastHabitRef = useRef<Habit | null>(null)
  if (habit) lastHabitRef.current = habit
  const displayHabit = lastHabitRef.current

  const stats = useMemo(
    () => displayHabit ? getHabitStats(displayHabit.id) : null,
    [displayHabit?.id], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const dragControls = useDragControls()

  if (!displayHabit || !stats) return null

  function handleDragEnd(_: PointerEvent, info: PanInfo) {
    if (info.velocity.y > 400 || info.offset.y > 150) onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="hds__overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild aria-describedby={undefined}>
              <motion.div
                className="hds__panel"
                initial={{ y: "100%" }}
                animate={{ y: 0, transition: { type: "spring", stiffness: 340, damping: 34 } }}
                exit={{ y: "100%", transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } }}
                drag="y"
                dragControls={dragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.45 }}
                onDragEnd={handleDragEnd}
              >
                <div className="hds__handle" onPointerDown={e => dragControls.start(e)} />

                <div className="hds__header">
                  <span className="hds__icon" data-slot={displayHabit.timeSlot}>
                    <HabitIcon icon={displayHabit.icon} size={24} />
                  </span>
                  <div className="hds__title-group">
                    <Dialog.Title className="hds__title">{displayHabit.title}</Dialog.Title>
                    {displayHabit.description && <p className="hds__desc">{displayHabit.description}</p>}
                  </div>
                  <Dialog.Close className="hds__close" aria-label="Close">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </Dialog.Close>
                </div>

                <div className="hds__stats">
                  <div className="hds__stat">
                    <span className="hds__stat-value">
                      {stats.streak.current}
                      {stats.streak.current >= 2 && <FlameIcon size={14} />}
                    </span>
                    <span className="hds__stat-label">streak</span>
                  </div>
                  <div className="hds__stat-sep" />
                  <div className="hds__stat">
                    <span className="hds__stat-value">{stats.streak.best}</span>
                    <span className="hds__stat-label">best</span>
                  </div>
                  <div className="hds__stat-sep" />
                  <div className="hds__stat">
                    <span className="hds__stat-value">{stats.completionRate30}%</span>
                    <span className="hds__stat-label">30-day</span>
                  </div>
                  <div className="hds__stat-sep" />
                  <div className="hds__stat">
                    <span className="hds__stat-value">{stats.completedDays}</span>
                    <span className="hds__stat-label">done</span>
                  </div>
                </div>

                <div className="hds__calendar-section">
                  <p className="hds__calendar-label">Last 30 days</p>
                  <div className="hds__calendar" role="img" aria-label={`30-day completion history for ${displayHabit.title}`}>
                    {stats.dailyData.map(d => (
                      <Dot
                        key={d.date}
                        status={d.completed ? 'done' : d.skipped ? 'skip' : 'miss'}
                      />
                    ))}
                  </div>
                  <div className="hds__calendar-legend">
                    <span className="hds__legend-dot hds__legend-dot--done" />
                    <span className="hds__legend-label">Done</span>
                    <span className="hds__legend-dot hds__legend-dot--skip" />
                    <span className="hds__legend-label">Skipped</span>
                    <span className="hds__legend-dot hds__legend-dot--miss" />
                    <span className="hds__legend-label">Missed</span>
                  </div>
                </div>

                <div className="hds__actions">
                  <button className="hds__action hds__action--edit" onClick={onEdit}>
                    Edit habit
                  </button>
                  <button className="hds__action hds__action--archive" onClick={() => { onOpenChange(false); onArchive() }}>
                    Archive
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
