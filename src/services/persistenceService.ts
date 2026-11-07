import type { PersistedState } from '@/types/persistence'
import { CASES } from '@/data/cases'
import { EVIDENCE } from '@/data/evidence'
import { CRYPTIDS } from '@/data/cryptids'
import { isValidPersistedShape, sanitizePersistedState } from './validationService'

export const STORAGE_KEY = 'cryptid-casefiles-v1'
export const CURRENT_SCHEMA_VERSION = '1'

export type PersistableSlice = Omit<PersistedState, 'schemaVersion'>

function resolveStorage(storage?: Storage): Storage | null {
  if (storage) return storage
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null
  } catch {
    return null
  }
}

/** Picks only the seven persistable keys; excludes ephemeral state and actions. */
export function selectPersistable(state: PersistableSlice & Record<string, unknown>): PersistableSlice {
  return {
    caseStatuses: state.caseStatuses,
    collectedEvidence: state.collectedEvidence,
    observationNotes: state.observationNotes,
    nodePositions: state.nodePositions,
    connections: state.connections,
    unlockedCryptidIds: state.unlockedCryptidIds,
    reports: state.reports,
  }
}

export function loadPersistedState(storage?: Storage): PersistedState | null {
  const store = resolveStorage(storage)
  if (!store) return null

  let raw: string | null
  try {
    raw = store.getItem(STORAGE_KEY)
  } catch {
    return null
  }
  if (raw === null) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    console.warn('[persistence] Corrupt saved data discarded.')
    return null
  }

  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    (parsed as Record<string, unknown>).schemaVersion !== CURRENT_SCHEMA_VERSION
  ) {
    console.warn('[persistence] Schema version mismatch; resetting saved data.')
    try {
      store.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    return null
  }

  if (!isValidPersistedShape(parsed)) {
    console.warn('[persistence] Saved data has an invalid shape; ignoring.')
    return null
  }

  return sanitizePersistedState(
    parsed,
    CASES.map((c) => c.id),
    EVIDENCE.map((e) => e.id),
    CRYPTIDS.map((c) => c.id)
  )
}

export function savePersistedState(state: PersistableSlice, storage?: Storage): boolean {
  const store = resolveStorage(storage)
  if (!store) return false
  try {
    const payload: PersistedState = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      ...selectPersistable(state as PersistableSlice & Record<string, unknown>),
    }
    store.setItem(STORAGE_KEY, JSON.stringify(payload))
    return true
  } catch {
    return false
  }
}

export function clearPersistedState(storage?: Storage): void {
  const store = resolveStorage(storage)
  if (!store) return
  try {
    store.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
