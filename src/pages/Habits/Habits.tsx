import { useState, useMemo } from 'react'
import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion'
import { haptic } from '../../utils/haptic'
import { useHabitStore } from '../../store/useHabitStore'
import { useSlotTimingStore, formatSlotTime } from '../../store/useSlotTimingStore'
import { useToastStore } from '../../store/useToastStore'
import HabitForm from '../../components/HabitForm/HabitForm'
import { HabitDetailSheet } from '../../components/Habits/HabitDetailSheet'
import { HabitIcon, FlameIcon } from '../../components/Icons'
import type { Habit, TimeSlot, Streak } from '../../types'
import './Habits.css'

const SLOTS: { slot: TimeSlot; label: string }[] = [
  { slot: 'morning',   label: 'Morning'   },
  { slot: 'afternoon', label: 'Afternoon' },
  { slot: 'evening',   label: 'Evening'   },
  { slot: 'night',     label: 'Night'     },
]

const SLOT_ORDER: TimeSlot[] = ['morning', 'afternoon', 'evening', 'night']

function ClockEditIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true" className="habits-page__meta-edit-icon">
      <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 3v2.5l1.5 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9.5 2L12 4.5 4.5 12H2v-2.5L9.5 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 3.5v7.5a.5.5 0 00.5.5h3a.5.5 0 00.5-.5V3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function DragHandle({ onPointerDown }: { onPointerDown: (e: React.PointerEvent) => void }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
      className="habits-page__drag-handle"
      onPointerDown={onPointerDown}
      style={{ touchAction: 'none' }}
    >
      <circle cx="5" cy="4.5" r="1.2" fill="currentColor" />
      <circle cx="5" cy="8"   r="1.2" fill="currentColor" />
      <circle cx="5" cy="11.5" r="1.2" fill="currentColor" />
      <circle cx="11" cy="4.5" r="1.2" fill="currentColor" />
      <circle cx="11" cy="8"   r="1.2" fill="currentColor" />
      <circle cx="11" cy="11.5" r="1.2" fill="currentColor" />
    </svg>
  )
}

interface HabitRowProps {
  habit: Habit
  streak: Streak
  confirmArchive: string | null
  shakingId: string | null
  organizing: boolean
  selected: boolean
  onStartArchive: (id: string) => void
  onCancelArchive: () => void
  onArchive: (id: string) => void
  onDragStart: (e: React.PointerEvent) => void
  onSelect: (id: string) => void
  onShowDetail: (id: string) => void
}

function HabitRow({
  habit, streak, confirmArchive, shakingId, organizing, selected,
  onStartArchive, onCancelArchive, onArchive, onDragStart, onSelect, onShowDetail,
}: HabitRowProps) {
  const isConfirming = confirmArchive === habit.id
  const isShaking    = shakingId === habit.id

  return (
    <div
      className={[
        'habits-page__row',
        isConfirming   ? 'habits-page__row--confirming' : '',
        isShaking      ? 'habits-page__row--shaking'    : '',
        organizing && selected ? 'habits-page__row--selected' : '',
      ].filter(Boolean).join(' ')}
      data-slot={habit.timeSlot}
    >
      {isConfirming ? (
        <>
          <p className="habits-page__confirm-text">Archive &ldquo;{habit.title}&rdquo;?</p>
          <p className="habits-page__confirm-sub">History is preserved. You can restore it anytime.</p>
          <div className="habits-page__confirm-actions">
            <button className="habits-page__confirm-cancel" onClick={onCancelArchive}>Cancel</button>
            <button className="habits-page__confirm-delete" onClick={() => onArchive(habit.id)}>Archive</button>
          </div>
        </>
      ) : organizing ? (
        <>
          <button
            className={['habits-page__checkbox', selected ? 'habits-page__checkbox--checked' : ''].join(' ')}
            onClick={() => onSelect(habit.id)}
            aria-label={selected ? 'Deselect' : 'Select'}
          >
            {selected && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <span className="habits-page__row-icon"><HabitIcon icon={habit.icon} size={18} /></span>
          <div className="habits-page__row-body">
            <p className="habits-page__row-title">{habit.title}</p>
            {habit.description && (
              <p className="habits-page__row-desc">{habit.description}</p>
            )}
          </div>
        </>
      ) : (
        <>
          <DragHandle onPointerDown={onDragStart} />
          <span className="habits-page__row-icon"><HabitIcon icon={habit.icon} size={18} /></span>
          <div className="habits-page__row-body">
            <button
              className="habits-page__row-title habits-page__row-title--btn"
              onClick={() => onShowDetail(habit.id)}
            >
              {habit.title}
            </button>
            {habit.description && (
              <p className="habits-page__row-desc">{habit.description}</p>
            )}
          </div>
          {streak.current >= 2 && (
            <div className="habits-page__row-streak">
              <FlameIcon size={12} />
              <span className="habits-page__row-streak-num">{streak.current}</span>
            </div>
          )}
          <div className="habits-page__row-actions">
            <HabitForm defaultSlot={habit.timeSlot} habit={habit}>
              <button className="habits-page__action habits-page__action--edit" aria-label="Edit habit">
                <EditIcon />
              </button>
            </HabitForm>
            <button
              className="habits-page__action habits-page__action--delete"
              aria-label="Delete habit"
              onClick={() => onStartArchive(habit.id)}
            >
              <TrashIcon />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

type RowSharedProps = Pick<HabitRowProps, 'confirmArchive' | 'shakingId' | 'organizing' | 'onStartArchive' | 'onCancelArchive' | 'onArchive' | 'onSelect' | 'onShowDetail'>

function ReorderableRow({ habit, streak, selected, ...shared }: { habit: Habit; streak: Streak; selected: boolean } & RowSharedProps) {
  const dragControls = useDragControls()
  return (
    <Reorder.Item
      value={habit}
      dragControls={dragControls}
      dragListener={false}
      className="habits-page__reorder-item"
      whileDrag={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
    >
      <HabitRow
        habit={habit}
        streak={streak}
        selected={selected}
        onDragStart={e => dragControls.start(e)}
        {...shared}
      />
    </Reorder.Item>
  )
}

export default function Habits() {
  const { habits, logs, archiveHabit, unarchiveHabit, removeHabit, reorderHabits, getStreak, editHabit } = useHabitStore()
  const { timings, setSlotTiming } = useSlotTimingStore()
  const pushToast = useToastStore(s => s.push)
  const [confirmArchive, setConfirmArchive] = useState<string | null>(null)
  const [shakingId, setShakingId]           = useState<string | null>(null)
  const [search, setSearch]                 = useState('')
  const [organizing, setOrganizing]         = useState(false)
  const [selected, setSelected]             = useState<Set<string>>(new Set())
  const [showArchived, setShowArchived]     = useState(false)
  const [editingSlot, setEditingSlot]       = useState<TimeSlot | null>(null)
  const [editStart, setEditStart]           = useState('')
  const [editEnd, setEditEnd]               = useState('')
  const [detailHabitId, setDetailHabitId]           = useState<string | null>(null)
  const [editFromDetailId, setEditFromDetailId]     = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete]           = useState<string | null>(null)

  function handleStartEditTime(slot: TimeSlot) {
    setEditingSlot(slot)
    setEditStart(timings[slot].start)
    setEditEnd(timings[slot].end)
  }

  function handleSaveTime() {
    if (!editingSlot) return
    const idx = SLOT_ORDER.indexOf(editingSlot)

    setSlotTiming(editingSlot, editStart, editEnd)

    let cascaded = false
    if (idx < SLOT_ORDER.length - 1) {
      const next = SLOT_ORDER[idx + 1]
      setSlotTiming(next, editEnd, timings[next].end)
      cascaded = true
    }
    if (idx > 0) {
      const prev = SLOT_ORDER[idx - 1]
      setSlotTiming(prev, timings[prev].start, editStart)
      cascaded = true
    }

    setEditingSlot(null)
    if (cascaded) pushToast('Adjacent slots adjusted')
  }

  const activeHabits   = habits.filter(h => !h.isArchived)
  const archivedHabits = habits.filter(h => h.isArchived)

  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    const q = search.trim().toLowerCase()
    return activeHabits.filter(h =>
      h.title.toLowerCase().includes(q) ||
      (h.description ?? '').toLowerCase().includes(q)
    )
  }, [search, activeHabits])

  function handleStartArchive(id: string) {
    setShakingId(id)
    haptic('error')
    setTimeout(() => {
      setShakingId(null)
      setConfirmArchive(id)
    }, 380)
  }

  function handleToggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleBulkArchive() {
    selected.forEach(id => archiveHabit(id))
    setSelected(new Set())
    setOrganizing(false)
  }

  function handleBulkMove(slot: TimeSlot) {
    selected.forEach(id => editHabit(id, { timeSlot: slot }))
    setSelected(new Set())
    setOrganizing(false)
  }

  function exitOrganizing() {
    setOrganizing(false)
    setSelected(new Set())
  }

  const sharedProps: RowSharedProps = {
    confirmArchive,
    shakingId,
    organizing,
    onStartArchive: handleStartArchive,
    onCancelArchive: () => setConfirmArchive(null),
    onArchive: id => { archiveHabit(id); setConfirmArchive(null) },
    onSelect: handleToggleSelect,
    onShowDetail: id => setDetailHabitId(id),
  }

  const streakMap = useMemo(() => {
    const m = new Map<string, { habitId: string; current: number; best: number }>()
    activeHabits.forEach(h => m.set(h.id, getStreak(h.id)))
    return m
  }, [habits, logs]) // eslint-disable-line react-hooks/exhaustive-deps

  const detailHabit = habits.find(h => h.id === detailHabitId) ?? null
  const editFromDetailHabit = habits.find(h => h.id === editFromDetailId) ?? null

  return (
    <div className="habits-page">
      <div className="habits-page__header">
        <p className="habits-page__meta">{activeHabits.length} active habits</p>
        <button
          className={['habits-page__organize-btn', organizing ? 'habits-page__organize-btn--active' : ''].join(' ')}
          onClick={() => organizing ? exitOrganizing() : setOrganizing(true)}
        >
          {organizing ? 'Done' : 'Organize'}
        </button>
      </div>

      {!organizing && (
        <div className="habits-page__search-wrap">
          <svg className="habits-page__search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            className="habits-page__search"
            type="text"
            placeholder="Search habits…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="habits-page__search-clear" onClick={() => setSearch('')} aria-label="Clear search">×</button>
          )}
        </div>
      )}

      {search.trim() && (
        <div className="habits-page__search-results">
          {searchResults.length === 0 ? (
            <p className="habits-page__search-empty">No habits match "{search}"</p>
          ) : (
            searchResults.map(habit => (
              <div key={habit.id} className="habits-page__row" data-slot={habit.timeSlot}>
                <span className="habits-page__row-icon"><HabitIcon icon={habit.icon} size={18} /></span>
                <div className="habits-page__row-body">
                  <p className="habits-page__row-title">{habit.title}</p>
                  <p className="habits-page__row-desc habits-page__row-slot-label">
                    {SLOTS.find(s => s.slot === habit.timeSlot)?.label}
                  </p>
                </div>
                <div className="habits-page__row-actions">
                  <HabitForm defaultSlot={habit.timeSlot} habit={habit}>
                    <button className="habits-page__action habits-page__action--edit" aria-label="Edit habit">
                      <EditIcon />
                    </button>
                  </HabitForm>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!search.trim() && SLOTS.map(({ slot, label }) => {
        const slotHabits = activeHabits.filter(h => h.timeSlot === slot)
        if (slotHabits.length === 0) return null

        return (
          <section key={slot} className="habits-page__section" data-slot={slot}>
            <div className="habits-page__section-header">
              <h3 className="habits-page__section-title">{label}</h3>
              {editingSlot === slot ? (
                <div className="habits-page__time-editor">
                  <input
                    type="time"
                    className="habits-page__time-input"
                    value={editStart}
                    onChange={e => setEditStart(e.target.value)}
                  />
                  <span className="habits-page__time-sep">–</span>
                  <input
                    type="time"
                    className="habits-page__time-input"
                    value={editEnd}
                    onChange={e => setEditEnd(e.target.value)}
                  />
                  <button className="habits-page__time-save" onClick={handleSaveTime}>Done</button>
                </div>
              ) : (
                <button
                  className="habits-page__section-meta habits-page__section-meta--btn"
                  onClick={() => handleStartEditTime(slot)}
                >
                  {formatSlotTime(timings[slot])}<ClockEditIcon />
                </button>
              )}
            </div>

            <Reorder.Group
              axis="y"
              values={slotHabits}
              onReorder={reordered => reorderHabits(slot, reordered)}
              className="habits-page__reorder-group"
            >
              <AnimatePresence initial={false}>
                {slotHabits.map(habit => (
                  <ReorderableRow
                    key={habit.id}
                    habit={habit}
                    streak={streakMap.get(habit.id) ?? { habitId: habit.id, current: 0, best: 0 }}
                    selected={selected.has(habit.id)}
                    {...sharedProps}
                  />
                ))}
              </AnimatePresence>
            </Reorder.Group>

            {!organizing && (
              <HabitForm defaultSlot={slot}>
                <button className="habits-page__section-add">
                  <span>+</span> Add to {label}
                </button>
              </HabitForm>
            )}
          </section>
        )
      })}

      {!search.trim() && !organizing && activeHabits.length === 0 && (
        <motion.div
          className="habits-page__empty"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          role="region"
          aria-label="No habits yet"
        >
          <div className="habits-page__empty-icon" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect x="6" y="9" width="28" height="26" rx="4" stroke="currentColor" strokeWidth="1.8" />
              <rect x="6" y="9" width="28" height="7" rx="4" fill="currentColor" opacity="0.12" />
              <path d="M13 20h14M13 27h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="habits-page__empty-title">No habits yet</h3>
          <p className="habits-page__empty-sub">
            Build habits that stick. Start with one.
          </p>
          <HabitForm defaultSlot="morning">
            <button className="habits-page__empty-cta">
              Add your first habit →
            </button>
          </HabitForm>
        </motion.div>
      )}

      {!organizing && !search.trim() && archivedHabits.length > 0 && (
        <section className="habits-page__section habits-page__section--archived">
          <button
            className="habits-page__archived-toggle"
            onClick={() => setShowArchived(v => !v)}
          >
            <span>Archived ({archivedHabits.length})</span>
            <svg
              className={['habits-page__archived-chevron', showArchived ? 'habits-page__archived-chevron--open' : ''].join(' ')}
              width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <AnimatePresence>
            {showArchived && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                style={{ overflow: 'hidden' }}
              >
                {archivedHabits.map(habit => (
                  <div key={habit.id} className="habits-page__row habits-page__row--archived" data-slot={habit.timeSlot}>
                    {confirmDelete === habit.id ? (
                      <>
                        <p className="habits-page__confirm-text">Delete &ldquo;{habit.title}&rdquo; permanently?</p>
                        <p className="habits-page__confirm-sub">This removes all history and cannot be undone.</p>
                        <div className="habits-page__confirm-actions">
                          <button className="habits-page__confirm-cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
                          <button className="habits-page__confirm-delete" onClick={() => { removeHabit(habit.id); setConfirmDelete(null) }}>Delete</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="habits-page__row-icon" style={{ opacity: 0.5 }}><HabitIcon icon={habit.icon} size={18} /></span>
                        <div className="habits-page__row-body">
                          <p className="habits-page__row-title" style={{ opacity: 0.55 }}>{habit.title}</p>
                        </div>
                        <button
                          className="habits-page__action habits-page__action--restore"
                          onClick={() => unarchiveHabit(habit.id)}
                        >
                          Restore
                        </button>
                        <button
                          className="habits-page__action habits-page__action--delete"
                          aria-label="Delete permanently"
                          onClick={() => setConfirmDelete(habit.id)}
                        >
                          <TrashIcon />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {!organizing && !search.trim() && (
        <HabitForm defaultSlot="morning">
          <button className="habits-page__fab" aria-label="Add habit">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </HabitForm>
      )}

      <AnimatePresence>
        {organizing && (
          <motion.div
            className="habits-page__organize-bar"
            style={{ x: '-50%' }}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            {selected.size === 0 ? (
              <p className="habits-page__organize-hint">Tap habits to select them</p>
            ) : (
              <>
                <div className="habits-page__organize-header">
                  <p className="habits-page__organize-count">{selected.size} habit{selected.size > 1 ? 's' : ''} selected</p>
                  <button className="habits-page__organize-clear" onClick={() => setSelected(new Set())}>Clear</button>
                </div>
                <div className="habits-page__organize-actions">
                  <div className="habits-page__organize-move">
                    <span className="habits-page__organize-move-label">Move to slot</span>
                    <div className="habits-page__organize-move-slots">
                      {SLOTS.map(({ slot, label }) => (
                        <button
                          key={slot}
                          className="habits-page__organize-slot-btn"
                          onClick={() => handleBulkMove(slot)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button className="habits-page__organize-archive" onClick={handleBulkArchive}>
                    Archive selected
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <HabitDetailSheet
        habit={detailHabit}
        open={!!detailHabitId}
        onOpenChange={val => { if (!val) setDetailHabitId(null) }}
        onEdit={() => {
          const id = detailHabitId
          setDetailHabitId(null)
          setTimeout(() => setEditFromDetailId(id), 240)
        }}
        onArchive={() => { if (detailHabitId) handleStartArchive(detailHabitId) }}
      />

      {editFromDetailHabit && (
        <HabitForm
          defaultSlot={editFromDetailHabit.timeSlot}
          habit={editFromDetailHabit}
          open={true}
          onOpenChange={val => { if (!val) setEditFromDetailId(null) }}
        />
      )}
    </div>
  )
}
