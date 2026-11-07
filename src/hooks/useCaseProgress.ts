import { useAppStore } from '@/store'
import { CASES } from '@/data/cases'
import { EVIDENCE } from '@/data/evidence'
import type { Case, EvidenceItem } from '@/types/domain'
import type { CaseStatus } from '@/types/progress'

const EMPTY_IDS: string[] = []

export interface CaseProgress {
  caseData: Case | undefined
  status: CaseStatus
  evidenceItems: EvidenceItem[]
  collectedIds: string[]
  collectedCount: number
  totalCount: number
  isClosed: boolean
}

/** Derives per-case progress from the store and seed data. */
export function useCaseProgress(caseId: string | undefined): CaseProgress {
  const status: CaseStatus =
    useAppStore((s) => (caseId ? s.caseStatuses[caseId] : undefined)) ?? 'new'
  const collectedIds =
    useAppStore((s) => (caseId ? s.collectedEvidence[caseId] : undefined)) ?? EMPTY_IDS

  const caseData = CASES.find((c) => c.id === caseId)
  const evidenceItems = caseData
    ? caseData.evidenceIds
        .map((id) => EVIDENCE.find((e) => e.id === id))
        .filter((e): e is EvidenceItem => e !== undefined)
    : []

  return {
    caseData,
    status,
    evidenceItems,
    collectedIds,
    collectedCount: collectedIds.length,
    totalCount: caseData ? caseData.evidenceIds.length : 0,
    isClosed: status === 'closed',
  }
}
