import { useAppStore } from '@/store'
import { loadPersistedState } from '@/services/persistenceService'
import { CASES } from '@/data/cases'
import { CRYPTIDS } from '@/data/cryptids'
import type { PersistedState } from '@/types/persistence'

export type HydrationOutcome = 'restored' | 'fresh'

let hydrated = false
const listeners = new Set<() => void>()

export function isHydrated(): boolean {
  return hydrated
}

export function subscribeHydration(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function markHydrated(): void {
  hydrated = true
  listeners.forEach((l) => l())
}

/** Test helper: clears the hydrated flag. */
export function resetHydrationFlag(): void {
  hydrated = false
  listeners.forEach((l) => l())
}

/**
 * Conservative coherence pass over persisted data (guards against tampering):
 * - identified/closed cases must have their playable correct cryptid unlocked
 *   (archive-only cryptids are never unlocked);
 * - a report on a case that is not 'closed' is promoted to 'closed' if the case is
 *   'identified', otherwise discarded;
 * - a 'closed' case without a report is downgraded to 'identified'.
 */
function normalise(data: PersistedState): PersistedState {
  const caseStatuses = { ...data.caseStatuses }
  const reports = { ...data.reports }
  const unlocked = [...data.unlockedCryptidIds]

  for (const c of CASES) {
    let status = caseStatuses[c.id]
    if (status === undefined) {
      delete reports[c.id]
      continue
    }
    if (reports[c.id] && status !== 'closed') {
      if (status === 'identified') status = 'closed'
      else delete reports[c.id]
    }
    if (status === 'closed' && !reports[c.id]) status = 'identified'
    caseStatuses[c.id] = status

    if (status === 'identified' || status === 'closed') {
      const cryptid = CRYPTIDS.find((x) => x.id === c.correctCryptidId)
      if (cryptid && cryptid.mvpStatus === 'playable' && !unlocked.includes(cryptid.id)) {
        unlocked.push(cryptid.id)
      }
    }
  }

  return { ...data, caseStatuses, reports, unlockedCryptidIds: unlocked }
}

/**
 * Loads persisted state and merges it into the store. Synchronous; call before first render.
 * When nothing valid is saved the default state is left untouched (and nothing is written).
 */
export function hydrateStore(storage?: Storage): HydrationOutcome {
  let outcome: HydrationOutcome = 'fresh'
  try {
    const loaded = loadPersistedState(storage)
    if (loaded) {
      const data = normalise(loaded)
      useAppStore.setState({
        caseStatuses: data.caseStatuses,
        collectedEvidence: data.collectedEvidence,
        observationNotes: data.observationNotes,
        nodePositions: data.nodePositions,
        connections: data.connections,
        unlockedCryptidIds: data.unlockedCryptidIds,
        reports: data.reports,
      })
      outcome = 'restored'
    }
  } catch {
    outcome = 'fresh'
  }
  markHydrated()
  return outcome
}
