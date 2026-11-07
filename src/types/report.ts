export interface ReportEvidenceEntry {
  evidenceId: string
  name: string
  description: string
  observationNote: string
  category: string
  /** Whether this item supports the identified cryptid (from the identification assessment) */
  supportsIdentification: boolean
  /** Assessment rationale captured at filing time */
  rationale: string
}

export interface InvestigationReport {
  caseId: string
  caseTitle: string
  filedAt: string
  identifiedCryptidId: string
  identifiedCryptidName: string
  confidenceScore: number
  collectedEvidence: ReportEvidenceEntry[]
  caseClassification: string
  location: string
  incidentDate: string
  identifiedCryptidClassification: string
  matchingEvidenceCount: number
  totalAssociatedEvidence: number
  analysisSummary: string
  connectionCount: number
  /** Non-empty investigator labels from board connections */
  connectionNotes: string[]
}
