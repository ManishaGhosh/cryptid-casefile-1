import type { Case, Cryptid, EvidenceItem } from '@/types/domain'
import type { EvidenceConnection } from '@/types/board'
import type { IdentificationResult } from '@/types/identification'
import type { InvestigationReport, ReportEvidenceEntry } from '@/types/report'

export interface BuildReportInput {
  caseData: Case
  cryptid: Cryptid
  result: IdentificationResult
  collectedEvidenceIds: string[]
  evidence: EvidenceItem[]
  observationNotes: Record<string, string>
  connections: EvidenceConnection[]
  /** ISO timestamp supplied by the caller to keep this function pure */
  filedAt: string
}

/** Pure: snapshots the investigation into a report. Only valid for correct identifications. */
export function buildReport(input: BuildReportInput): InvestigationReport {
  const { caseData, cryptid, result, collectedEvidenceIds, evidence, observationNotes, connections, filedAt } =
    input

  if (result.outcome !== 'success') {
    throw new Error(`Cannot build a report for a non-success identification (${result.outcome}).`)
  }
  if (cryptid.id !== caseData.correctCryptidId || result.submittedCryptidId !== cryptid.id) {
    throw new Error(`Cryptid ${cryptid.id} is not the correct identification for ${caseData.id}.`)
  }

  const collectedEvidence: ReportEvidenceEntry[] = []
  for (const id of collectedEvidenceIds) {
    const item = evidence.find((e) => e.id === id)
    if (!item) continue
    const assessment = result.assessments.find((a) => a.evidenceId === id)
    collectedEvidence.push({
      evidenceId: item.id,
      name: item.name,
      description: item.description,
      observationNote: observationNotes[id] ?? '',
      category: item.category,
      supportsIdentification: assessment?.supportsSuspect ?? false,
      rationale: assessment?.explanation ?? '',
    })
  }

  const connectionNotes = connections
    .map((c) => (c.data?.label ?? '').trim())
    .filter((label) => label.length > 0)

  return {
    caseId: caseData.id,
    caseTitle: caseData.title,
    filedAt,
    identifiedCryptidId: cryptid.id,
    identifiedCryptidName: cryptid.name,
    confidenceScore: result.confidenceScore,
    collectedEvidence,
    caseClassification: caseData.classification,
    location: caseData.location,
    incidentDate: caseData.incidentDate,
    identifiedCryptidClassification: cryptid.classification,
    matchingEvidenceCount: result.matchingEvidenceCount,
    totalAssociatedEvidence: cryptid.associatedEvidenceIds.length,
    analysisSummary: result.summary,
    connectionCount: connections.length,
    connectionNotes,
  }
}
