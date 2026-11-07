export type IdentificationOutcome =
  | 'success'
  | 'inconclusive'
  | 'insufficient-evidence'
  | 'unknown-entity'

export interface EvidenceAssessment {
  evidenceId: string
  evidenceName: string
  category: string
  /** true if this collected item is part of the suspect's evidence profile */
  supportsSuspect: boolean
  /** seed rationale when it supports; a deterministic mismatch explanation when it doesn't */
  explanation: string
}

export interface IdentificationResult {
  outcome: IdentificationOutcome
  /** Always calculated and returned regardless of outcome */
  confidenceScore: number
  matchingEvidenceCount: number
  /** Categories missing for 'insufficient-evidence' outcome */
  missingCategories: string[]
  submittedCryptidId: string
  submittedCryptidName: string
  /** Suspect's minimumThreshold (null when unknown or archive-only) */
  requiredCount: number | null
  /** max(0, requiredCount - matching) when correct suspect, else 0 */
  evidenceNeeded: number
  /** One per collected item, in collection order */
  assessments: EvidenceAssessment[]
  /** One deterministic sentence for the result header */
  summary: string
}
