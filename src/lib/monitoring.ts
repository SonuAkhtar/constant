type SentryModule = typeof import('@sentry/react')

let sentry: SentryModule | null = null
let currentUserId: string | null = null

export async function initMonitoring(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (!dsn || sentry) return
  try {
    const mod = await import('@sentry/react')
    mod.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0,
    })
    sentry = mod
    mod.setUser(currentUserId ? { id: currentUserId } : null)
  } catch (e) {
    console.error('[monitoring] failed to start', e)
  }
}

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  console.error(error, context ?? '')
  sentry?.captureException(error, context ? { extra: context } : undefined)
}

export function setMonitoringUser(userId: string | null): void {
  currentUserId = userId
  sentry?.setUser(userId ? { id: userId } : null)
}
