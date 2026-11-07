import { useCallback, useEffect, useState } from 'react'
import { useAppStore } from '@/store'
import { CASES } from '@/data/cases'
import { CRYPTIDS } from '@/data/cryptids'
import { EVIDENCE } from '@/data/evidence'
import { runIdentification } from '@/services/identificationEngine'
import { buildReport } from '@/services/reportBuilder'
import { useCaseProgress } from '@/hooks/useCaseProgress'
import type { IdentificationResult } from '@/types/identification'

export const MINIMUM_EVIDENCE_REQUIRED = 2

export interface UseIdentification {
  selectedCryptidId: string | null
  setSelectedCryptidId: (id: string | null) => void
  canSubmit: boolean
  minimumRequired: number
  submit: () => void
  /** Result produced for this case only; null otherwise */
  result: IdentificationResult | null
  dismiss: () => void
  /** Files the report and closes the case; returns the report route, or null if not allowed */
  fileReport: () => string | null
}

export function useIdentification(caseId: string): UseIdentification {
  const { status, collectedIds, collectedCount } = useCaseProgress(caseId)
  const storeResult = useAppStore((s) => s.lastIdentificationResult)
  const setLastIdentificationResult = useAppStore((s) => s.setLastIdentificationResult)
  const unlockCryptid = useAppStore((s) => s.unlockCryptid)
  const setCaseStatus = useAppStore((s) => s.setCaseStatus)

  const [selectedCryptidId, setSelectedCryptidId] = useState<string | null>(null)
  const [ownerCaseId, setOwnerCaseId] = useState<string | null>(null)

  // The store result is global: clear it when leaving this case / unmounting.
  useEffect(() => {
    return () => {
      useAppStore.getState().setLastIdentificationResult(null)
    }
  }, [caseId])

  const canSubmit =
    collectedCount >= MINIMUM_EVIDENCE_REQUIRED &&
    selectedCryptidId !== null &&
    status !== 'closed' &&
    status !== 'identified'

  const submit = useCallback((): void => {
    const caseData = CASES.find((c) => c.id === caseId)
    if (!caseData || !selectedCryptidId || !canSubmit) return

    const result = runIdentification({
      caseData,
      submittedCryptidId: selectedCryptidId,
      collectedEvidenceIds: collectedIds,
      cryptids: CRYPTIDS,
      evidence: EVIDENCE,
    })
    setOwnerCaseId(caseId)
    setLastIdentificationResult(result)

    if (result.outcome === 'success') {
      const cryptid = CRYPTIDS.find((c) => c.id === result.submittedCryptidId)
      // Archive-only cryptids are permanently locked and never unlocked.
      if (cryptid && cryptid.mvpStatus === 'playable') unlockCryptid(cryptid.id)
      setCaseStatus(caseId, 'identified')
    } else {
      setCaseStatus(caseId, 'in-progress')
    }
  }, [
    caseId,
    selectedCryptidId,
    canSubmit,
    collectedIds,
    setLastIdentificationResult,
    unlockCryptid,
    setCaseStatus,
  ])

  const dismiss = useCallback((): void => {
    setLastIdentificationResult(null)
  }, [setLastIdentificationResult])

  const fileReport = useCallback((): string | null => {
    const state = useAppStore.getState()
    if (state.caseStatuses[caseId] !== 'identified' || state.reports[caseId]) return null
    const caseData = CASES.find((c) => c.id === caseId)
    const cryptid = caseData && CRYPTIDS.find((c) => c.id === caseData.correctCryptidId)
    if (!caseData || !cryptid) return null

    const ids = state.collectedEvidence[caseId] ?? []
    // Rebuild the result so filing works after a reload (ephemeral result is gone).
    const result = runIdentification({
      caseData,
      submittedCryptidId: cryptid.id,
      collectedEvidenceIds: ids,
      cryptids: CRYPTIDS,
      evidence: EVIDENCE,
    })
    if (result.outcome !== 'success') return null

    const report = buildReport({
      caseData,
      cryptid,
      result,
      collectedEvidenceIds: ids,
      evidence: EVIDENCE,
      observationNotes: state.observationNotes,
      connections: state.connections[caseId] ?? [],
      filedAt: new Date().toISOString(),
    })
    state.fileReport(report)
    state.setCaseStatus(caseId, 'closed')
    state.setLastIdentificationResult(null)
    return `/case/${caseId}/report`
  }, [caseId])

  return {
    selectedCryptidId,
    setSelectedCryptidId,
    canSubmit,
    minimumRequired: MINIMUM_EVIDENCE_REQUIRED,
    submit,
    result: ownerCaseId === caseId ? storeResult : null,
    dismiss,
    fileReport,
  }
}
