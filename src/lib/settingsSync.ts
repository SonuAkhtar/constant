import { fetchSettings, saveSettings } from './db'
import { useThemeStore } from '../store/useThemeStore'
import { useSlotTimingStore, DEFAULT_TIMINGS, type SlotTimings } from '../store/useSlotTimingStore'
import { useWorkoutStore } from '../store/useWorkoutStore'
import { usePhotoStore } from '../store/usePhotoStore'
import type { ExperienceLevel, WorkoutVolume } from '../types'

interface SyncedSettings {
  theme: 'light' | 'dark'
  slotTimings: SlotTimings
  workout: { level: ExperienceLevel; volume: WorkoutVolume; weights: Record<string, number> }
  photo: string
}

function collect(): SyncedSettings {
  const w = useWorkoutStore.getState()
  return {
    theme: useThemeStore.getState().theme,
    slotTimings: useSlotTimingStore.getState().timings,
    workout: { level: w.level, volume: w.volume, weights: w.weights },
    photo: usePhotoStore.getState().photo,
  }
}

let applying = false

function apply(raw: Record<string, unknown>) {
  const s = raw as Partial<SyncedSettings>
  applying = true
  try {
    if (s.theme === 'light' || s.theme === 'dark') {
      if (useThemeStore.getState().theme !== s.theme) useThemeStore.getState().toggleTheme()
    }
    if (s.slotTimings && typeof s.slotTimings === 'object') {
      useSlotTimingStore.getState().setTimings({ ...DEFAULT_TIMINGS, ...s.slotTimings })
    }
    if (s.workout && typeof s.workout === 'object') {
      const { level, volume, weights } = s.workout
      useWorkoutStore.setState({
        ...(level === 'beginner' || level === 'intermediate' ? { level } : {}),
        ...(volume === 6 || volume === 8 ? { volume } : {}),
        ...(weights && typeof weights === 'object' ? { weights } : {}),
      })
    }
    if (typeof s.photo === 'string') usePhotoStore.getState().setPhoto(s.photo)
  } finally {
    applying = false
  }
}

let unsubscribe: (() => void) | null = null
let timer: ReturnType<typeof setTimeout> | undefined
let pendingSave: (() => void) | null = null

export async function startSettingsSync(userId: string): Promise<void> {
  stopSettingsSync()
  const remote = await fetchSettings(userId)
  if (remote) apply(remote)
  else if (remote === null) saveSettings(userId, collect() as unknown as Record<string, unknown>)

  const schedule = () => {
    if (applying) return
    clearTimeout(timer)
    pendingSave = () => {
      pendingSave = null
      saveSettings(userId, collect() as unknown as Record<string, unknown>)
    }
    timer = setTimeout(() => pendingSave?.(), 800)
  }
  const subs = [
    useThemeStore.subscribe(schedule),
    useSlotTimingStore.subscribe(schedule),
    useWorkoutStore.subscribe(schedule),
    usePhotoStore.subscribe(schedule),
  ]
  unsubscribe = () => subs.forEach((u) => u())
}

function stopSettingsSync() {
  clearTimeout(timer)
  pendingSave?.()
  unsubscribe?.()
  unsubscribe = null
}

export function resetAccountSettings() {
  stopSettingsSync()
  useSlotTimingStore.getState().setTimings(DEFAULT_TIMINGS)
  useWorkoutStore.setState({ weights: {}, level: 'intermediate', volume: 6 })
  usePhotoStore.getState().reset()
}
