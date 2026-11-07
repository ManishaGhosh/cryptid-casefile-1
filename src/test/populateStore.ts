import { useAppStore } from '@/store'
import type { InvestigationReport } from '@/types/report'

/** Fills every persisted slice with sample progress (test helper). */
export function populateStore(): void {
  const s = useAppStore.getState()
  s.setCaseStatus('case-001', 'in-progress')
  s.collectEvidence('case-001', 'ev-001')
  s.saveObservationNote('ev-001', 'a note')
  s.updateNodePosition('case-001', 'ev-001', 10, 20)
  s.addConnection('case-001', { id: 'e1', source: 'a', target: 'b', data: { label: 'x' } })
  s.unlockCryptid('cryptid-001')
  s.fileReport({ caseId: 'case-001', caseTitle: 'T' } as InvestigationReport)
}
