/** Classification security level displayed on all case materials. */
export type ClassificationLevel =
  | 'LEVEL 1 — UNCLASSIFIED'
  | 'LEVEL 2 — RESTRICTED'
  | 'LEVEL 3 — RESTRICTED'
  | 'LEVEL 4 — CONFIDENTIAL'
  | 'LEVEL 5 — EYES ONLY'

export interface WitnessStatement {
  witness: string
  statement: string
}

export interface Case {
  id: string
  title: string
  classification: ClassificationLevel
  location: string
  incidentDate: string
  narrative: string
  witnessStatements: WitnessStatement[]
  evidenceIds: string[]
  correctCryptidId: string
}

export interface EvidenceItem {
  id: string
  caseId: string
  name: string
  description: string
  /** Broad category label for "Insufficient Evidence" feedback */
  category: string
}

export interface Cryptid {
  id: string
  name: string
  classification: string
  description: string
  behaviour: string
  loreExcerpt: string
  associatedEvidenceIds: string[]
  minimumThreshold: number | null
  /** 3–4 short observable traits that define this cryptid */
  signatureTraits: string[]
  /** Evidence id → one sentence explaining how that evidence is consistent with this cryptid */
  evidenceRationale: Record<string, string>
  /** 'playable' = identifiable; 'archive-only' = permanently locked in MVP */
  mvpStatus: 'playable' | 'archive-only'
}
