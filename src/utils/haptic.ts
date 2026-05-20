type HapticPattern = 'light' | 'medium' | 'success' | 'error' | 'celebration'

const PATTERNS: Record<HapticPattern, number[]> = {
  light:       [10],
  medium:      [20],
  success:     [10, 30, 10],
  error:       [50, 10, 50],
  celebration: [30, 20, 60, 20, 80],
}

let lastFired = 0

export function haptic(pattern: HapticPattern) {
  if (!navigator.vibrate) return
  const now = Date.now()
  if (now - lastFired < 200) return
  lastFired = now
  navigator.vibrate(PATTERNS[pattern])
}
