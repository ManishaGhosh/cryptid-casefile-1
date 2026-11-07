import type { CaseStatus } from './progress'
import type { EvidenceConnection } from './board'
import type { InvestigationReport } from './report'

/** Shape written to LocalStorage under `cryptid-casefiles-v1`. */
export interface PersistedState {
  schemaVersion: string
  caseStatuses: Record<string, CaseStatus>
  collectedEvidence: Record<string, string[]>
  observationNotes: Record<string, string>
  nodePositions: Record<string, { x: number; y: number }>
  connections: Record<string, EvidenceConnection[]>
  unlockedCryptidIds: string[]
  reports: Record<string, InvestigationReport>
}
