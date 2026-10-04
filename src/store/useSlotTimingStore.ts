import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TimeSlot } from '../types'

export interface SlotTiming {
  start: string
  end: string
}

export type SlotTimings = Record<TimeSlot, SlotTiming>

export const DEFAULT_TIMINGS: SlotTimings = {
  morning:   { start: '06:00', end: '12:00' },
  afternoon: { start: '12:00', end: '17:00' },
  evening:   { start: '17:00', end: '21:00' },
  night:     { start: '21:00', end: '23:00' },
}

interface SlotTimingState {
  timings: SlotTimings
  setTimings: (timings: SlotTimings) => void
}

export const useSlotTimingStore = create<SlotTimingState>()(
  persist(
    (set) => ({
      timings: DEFAULT_TIMINGS,
      setTimings: (timings) => set({ timings }),
    }),
    { name: 'progress-slot-timings', version: 1, migrate: (s) => s as SlotTimingState }
  )
)

export function formatSlotTime(timing: SlotTiming): string {
  return `${fmtHour(timing.start)} - ${fmtHour(timing.end)}`
}

function fmtHour(time: string): string {
  const [h, m] = (time || '00:00').split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return '-'
  const period = h < 12 ? 'am' : 'pm'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2, '0')}${period}`
}

const SLOT_ORDER: TimeSlot[] = ['morning', 'afternoon', 'evening', 'night']

function toMins(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

export function cascadeSlotTiming(
  timings: SlotTimings,
  slot: TimeSlot,
  start: string,
  end: string,
): { timings: SlotTimings } | { error: string } {
  if (!TIME_RE.test(start) || !TIME_RE.test(end)) return { error: 'Enter both a start and an end time.' }
  if (toMins(start) >= toMins(end)) return { error: 'End time must be after the start time.' }
  const next: SlotTimings = { ...timings, [slot]: { start, end } }
  const idx = SLOT_ORDER.indexOf(slot)
  if (idx > 0) {
    const prev = SLOT_ORDER[idx - 1]
    next[prev] = { start: timings[prev].start, end: start }
    if (toMins(next[prev].start) >= toMins(start)) return { error: `That would leave no time for ${prev}.` }
  }
  if (idx < SLOT_ORDER.length - 1) {
    const after = SLOT_ORDER[idx + 1]
    next[after] = { start: end, end: timings[after].end }
    if (toMins(end) >= toMins(next[after].end)) return { error: `That would leave no time for ${after}.` }
  }
  return { timings: next }
}

export function getActiveSlotIndex(timings: SlotTimings, currentHour: number): number {
  const now = currentHour * 60
  for (let i = 0; i < SLOT_ORDER.length; i++) {
    const t = timings[SLOT_ORDER[i]]
    if (now >= toMins(t.start) && now < toMins(t.end)) return i
  }
  for (let i = 0; i < SLOT_ORDER.length; i++) {
    if (now < toMins(timings[SLOT_ORDER[i]].start)) return i
  }
  return 3
}
