/**
 * Identification engine: a pure function. No React or store imports, no side effects.
 *
 * Evaluation order (non-negotiable):
 *   1. suspect not in bureau records            -> 'unknown-entity'
 *   2. suspect !== case.correctCryptidId         -> 'inconclusive' (regardless of score)
 *   3. matching < minimumThreshold               -> 'insufficient-evidence'
 *   4. otherwise                                 -> 'success'
 */
import type { Case, Cryptid, EvidenceItem } from '@/types/domain'
import type { EvidenceAssessment, IdentificationResult } from '@/types/identification'
import { calculateConfidenceScore, countMatchingEvidence } from './scoreCalculator'

export interface IdentificationInput {
  caseData: Case
  submittedCryptidId: string
  collectedEvidenceIds: readonly string[]
  cryptids: readonly Cryptid[]
  evidence: readonly EvidenceItem[]
}

/**
 * Distinct category labels of associated evidence not yet collected, in associated (seed) order.
 */
export function computeMissingCategories(
  associatedIds: readonly string[],
  collectedIds: readonly string[],
  evidence: readonly EvidenceItem[],
): string[] {
  const collected = new Set(collectedIds)
  const byId = new Map(evidence.map((e) => [e.id, e] as const))
  const categories: string[] = []
  for (const id of associatedIds) {
    if (collected.has(id)) continue
    const item = byId.get(id)
    if (item && !categories.includes(item.category)) categories.push(item.category)
  }
  return categories
}

function plural(n: number, singular: string, pluralForm: string): string {
  return n === 1 ? singular : pluralForm
}

export function runIdentification(input: IdentificationInput): IdentificationResult {
  const { caseData, submittedCryptidId, cryptids, evidence } = input
  const collectedIds = Array.from(new Set(input.collectedEvidenceIds))

  const suspect = cryptids.find((c) => c.id === submittedCryptidId)

  // Step a: unknown entity guard
  if (!suspect) {
    return {
      outcome: 'unknown-entity',
      confidenceScore: 0,
      matchingEvidenceCount: 0,
      missingCategories: [],
      submittedCryptidId,
      submittedCryptidName: submittedCryptidId,
      requiredCount: null,
      evidenceNeeded: 0,
      assessments: [],
      summary: 'This entity is not in bureau records, so the evidence cannot be compared against any profile.',
    }
  }

  // Step b: matching count and confidence score
  const associatedIds = suspect.associatedEvidenceIds
  const caseEvidenceIds = new Set(caseData.evidenceIds)
  const caseCollected = collectedIds.filter((id) => caseEvidenceIds.has(id))
  const matching = countMatchingEvidence(caseCollected, associatedIds)
  const confidenceScore = calculateConfidenceScore(matching, associatedIds.length)
  const requiredCount = suspect.minimumThreshold

  // Step c: per-item assessments, in collection order
  const evidenceById = new Map(evidence.map((e) => [e.id, e] as const))
  const associatedSet = new Set(associatedIds)
  const assessments: EvidenceAssessment[] = []
  for (const id of collectedIds) {
    const item = evidenceById.get(id)
    if (!item) continue
    const supportsSuspect = associatedSet.has(id)
    const rationale = suspect.evidenceRationale[id]
    assessments.push({
      evidenceId: id,
      evidenceName: item.name,
      category: item.category,
      supportsSuspect,
      explanation:
        supportsSuspect && rationale
          ? rationale
          : `Nothing in the dossier for ${suspect.name} accounts for ${item.name.toLowerCase()} (${item.category}).`,
    })
  }

  const base = {
    confidenceScore,
    matchingEvidenceCount: matching,
    submittedCryptidId,
    submittedCryptidName: suspect.name,
    requiredCount,
    assessments,
  }

  // Step d: wrong cryptid is always inconclusive, whatever the score
  if (submittedCryptidId !== caseData.correctCryptidId) {
    return {
      ...base,
      outcome: 'inconclusive',
      missingCategories: [],
      evidenceNeeded: 0,
      summary: `The logged evidence does not fit the profile of ${suspect.name}.`,
    }
  }

  // Step e: threshold gate
  if (requiredCount !== null && matching < requiredCount) {
    const needed = requiredCount - matching
    return {
      ...base,
      outcome: 'insufficient-evidence',
      missingCategories: computeMissingCategories(associatedIds, collectedIds, evidence),
      evidenceNeeded: needed,
      summary: `Profile consistent with ${suspect.name}, but ${needed} more corroborating ${plural(needed, 'item is', 'items are')} required.`,
    }
  }

  // Step f: success
  return {
    ...base,
    outcome: 'success',
    missingCategories: [],
    evidenceNeeded: 0,
    summary: `${matching} of ${associatedIds.length} evidence items corroborate ${suspect.name}.`,
  }
}
