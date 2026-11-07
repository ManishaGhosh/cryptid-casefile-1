import { useCallback } from 'react'
import { useAppStore } from '@/store'
import { useCaseProgress } from './useCaseProgress'

export interface EvidenceCollection {
  isCollected: (evidenceId: string) => boolean
  /** Collects the item if possible. Returns true only when a new collection happened. */
  collect: (evidenceId: string) => boolean
}

export function useEvidenceCollection(caseId: string | undefined): EvidenceCollection {
  const { collectedIds, isClosed } = useCaseProgress(caseId)
  const collectEvidence = useAppStore((s) => s.collectEvidence)

  const isCollected = useCallback(
    (evidenceId: string) => collectedIds.includes(evidenceId),
    [collectedIds]
  )

  const collect = useCallback(
    (evidenceId: string) => {
      if (!caseId || isClosed || collectedIds.includes(evidenceId)) return false
      collectEvidence(caseId, evidenceId)
      return true
    },
    [caseId, isClosed, collectedIds, collectEvidence]
  )

  return { isCollected, collect }
}
