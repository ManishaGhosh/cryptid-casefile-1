import { savePersistedState, type PersistableSlice } from '@/services/persistenceService'

export const WRITE_DEBOUNCE_MS = 500

export interface PersistenceOptions {
  storage?: Storage
  debounceMs?: number
}

/** Minimal store surface needed for persistence (compatible with Zustand stores). */
export interface SubscribableStore<S extends PersistableSlice> {
  getState: () => S
  subscribe: (listener: (state: S, prevState: S) => void) => () => void
}

const PERSISTABLE_KEYS: ReadonlyArray<keyof PersistableSlice> = [
  'caseStatuses',
  'collectedEvidence',
  'observationNotes',
  'nodePositions',
  'connections',
  'unlockedCryptidIds',
  'reports',
]

function persistableChanged(next: PersistableSlice, prev: PersistableSlice): boolean {
  return PERSISTABLE_KEYS.some((key) => next[key] !== prev[key])
}

// Pending-write state (single app-wide persisted store).
let timer: ReturnType<typeof setTimeout> | null = null
let pendingWrite: (() => void) | null = null
let warned = false

/** Writes any pending debounced state immediately. */
export function flushPendingWrite(): void {
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
  const write = pendingWrite
  pendingWrite = null
  if (write) write()
}

/** Drops any pending write without saving (used by tests and the reset flow). */
export function cancelPendingWrite(): void {
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
  pendingWrite = null
}

/**
 * Subscribes to the store and schedules a debounced write whenever any
 * persistable key changes by reference. Returns a detach function.
 */
export function attachPersistence<S extends PersistableSlice>(
  store: SubscribableStore<S>,
  options: PersistenceOptions = {}
): () => void {
  const debounceMs = options.debounceMs ?? WRITE_DEBOUNCE_MS

  const unsubscribe = store.subscribe((next, prev) => {
    if (!persistableChanged(next, prev)) return

    if (timer !== null) clearTimeout(timer)
    pendingWrite = () => {
      // Always use the latest state at write time.
      const ok = savePersistedState(store.getState(), options.storage)
      if (!ok && !warned) {
        warned = true
        console.warn('[persistence] Unable to save progress; continuing in memory only.')
      }
    }
    timer = setTimeout(flushPendingWrite, debounceMs)
  })

  const onHidden = (): void => {
    if (typeof document !== 'undefined' && document.visibilityState !== 'hidden') return
    flushPendingWrite()
  }
  const onUnload = (): void => flushPendingWrite()

  if (typeof window !== 'undefined') {
    document.addEventListener('visibilitychange', onHidden)
    window.addEventListener('pagehide', onUnload)
    window.addEventListener('beforeunload', onUnload)
  }

  return () => {
    unsubscribe()
    if (typeof window !== 'undefined') {
      document.removeEventListener('visibilitychange', onHidden)
      window.removeEventListener('pagehide', onUnload)
      window.removeEventListener('beforeunload', onUnload)
    }
  }
}
