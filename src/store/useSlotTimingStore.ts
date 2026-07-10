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
  setSlotTiming: (slot: TimeSlot, start: string, end: string) => void
}

export const useSlotTimingStore = create<SlotTimingState>()(
  persist(
    (set) => ({
      timings: DEFAULT_TIMINGS,
      setSlotTiming: (slot, start, end) =>
        set(state => ({ timings: { ...state.timings, [slot]: { start, end } } })),
    }),
    { name: 'progress-slot-timings', version: 1, migrate: (s) => s as SlotTimingState }
  )
)

export function formatSlotTime(timing: SlotTiming): string {
  return `${fmtHour(timing.start)} – ${fmtHour(timing.end)}`
}

function fmtHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h < 12 ? 'am' : 'pm'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2, '0')}${period}`
}

const SLOT_ORDER: TimeSlot[] = ['morning', 'afternoon', 'evening', 'night']

function toMins(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
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
