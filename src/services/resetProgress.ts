import { useAppStore } from '@/store'
import { cancelPendingWrite } from '@/store/middleware/persistenceMiddleware'
import { clearEvidenceDrafts } from '@/components/features/case/EvidencePanel'
import { clearPersistedState } from '@/services/persistenceService'
import { clearRevealMemory } from '@/services/revealMemory'

/**
 * Resets every slice to its default state, drops unsaved note drafts and
 * removes the persisted key. Order matters: the resets schedule a debounced
 * write of the empty state, so pending writes are cancelled again before the
 * key is deleted.
 */
export function resetAllProgress(): void {
  cancelPendingWrite()
  const s = useAppStore.getState()
  s.resetAllCases()
  s.resetAllEvidence()
  s.resetAllBoards()
  s.resetArchive()
  s.resetAllReports()
  s.setLastIdentificationResult(null)
  clearEvidenceDrafts()
  cancelPendingWrite()
  clearPersistedState()
  clearRevealMemory()
}
