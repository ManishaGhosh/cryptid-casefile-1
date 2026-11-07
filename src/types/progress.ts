import type { EvidenceConnection } from './board'

export type CaseStatus = 'new' | 'in-progress' | 'identified' | 'closed'

export interface CaseProgress {
  caseId: string
  status: CaseStatus
  collectedEvidenceIds: string[]
  observationNotes: Record<string, string>
  nodePositions: Record<string, { x: number; y: number }>
  connections: EvidenceConnection[]
}

export interface UserProgress {
  schemaVersion: string
  cases: Record<string, CaseProgress>
  unlockedCryptidIds: string[]
  reports: Record<string, import('./report').InvestigationReport>
}
