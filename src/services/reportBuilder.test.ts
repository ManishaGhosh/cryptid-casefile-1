import { describe, expect, it } from 'vitest'
import { CASES } from '@/data/cases'
import { CRYPTIDS } from '@/data/cryptids'
import { EVIDENCE } from '@/data/evidence'
import { runIdentification } from '@/services/identificationEngine'
import { buildReport } from '@/services/reportBuilder'
import type { EvidenceConnection } from '@/types/board'

const caseData = CASES.find((c) => c.id === 'case-001')!
const warden = CRYPTIDS.find((c) => c.id === caseData.correctCryptidId)!
const ids = ['EV-001', 'EV-002', 'EV-003']
const FILED_AT = '2025-01-02T03:04:05.000Z'

function identify(cryptidId: string, collected: string[]) {
  return runIdentification({
    caseData,
    submittedCryptidId: cryptidId,
    collectedEvidenceIds: collected,
    cryptids: CRYPTIDS,
    evidence: EVIDENCE,
  })
}

const edge = (id: string, label: string): EvidenceConnection => ({
  id,
  source: 'EV-001',
  target: 'EV-002',
  data: { label },
})

describe('buildReport', () => {
  const result = identify(warden.id, ids)
  const report = buildReport({
    caseData,
    cryptid: warden,
    result,
    collectedEvidenceIds: ids,
    evidence: EVIDENCE,
    observationNotes: { 'EV-002': 'Scratches are fresh.' },
    connections: [edge('e1', 'Same tree line'), edge('e2', ''), edge('e3', '   ')],
    filedAt: FILED_AT,
  })

  it('maps case, cryptid and result fields', () => {
    expect(report.caseId).toBe('case-001')
    expect(report.caseTitle).toBe(caseData.title)
    expect(report.caseClassification).toBe(caseData.classification)
    expect(report.location).toBe(caseData.location)
    expect(report.incidentDate).toBe(caseData.incidentDate)
    expect(report.identifiedCryptidId).toBe(warden.id)
    expect(report.identifiedCryptidName).toBe(warden.name)
    expect(report.identifiedCryptidClassification).toBe(warden.classification)
    expect(report.confidenceScore).toBe(result.confidenceScore)
    expect(report.matchingEvidenceCount).toBe(result.matchingEvidenceCount)
    expect(report.totalAssociatedEvidence).toBe(warden.associatedEvidenceIds.length)
    expect(report.analysisSummary).toBe(result.summary)
    expect(report.filedAt).toBe(FILED_AT)
  })

  it('snapshots evidence in collection order with notes and rationale', () => {
    expect(report.collectedEvidence.map((e) => e.evidenceId)).toEqual(ids)
    const second = report.collectedEvidence[1]
    expect(second.observationNote).toBe('Scratches are fresh.')
    expect(report.collectedEvidence[0].observationNote).toBe('')
    report.collectedEvidence.forEach((entry, i) => {
      expect(entry.rationale).toBe(result.assessments[i].explanation)
      expect(entry.supportsIdentification).toBe(result.assessments[i].supportsSuspect)
      expect(entry.category).toBe(result.assessments[i].category)
    })
  })

  it('keeps only non-empty connection labels', () => {
    expect(report.connectionCount).toBe(3)
    expect(report.connectionNotes).toEqual(['Same tree line'])
  })

  it('throws for non-success results', () => {
    const wrong = CRYPTIDS.find((c) => c.id === 'cryptid-002')!
    const inconclusive = identify(wrong.id, ids)
    expect(() =>
      buildReport({
        caseData,
        cryptid: wrong,
        result: inconclusive,
        collectedEvidenceIds: ids,
        evidence: EVIDENCE,
        observationNotes: {},
        connections: [],
        filedAt: FILED_AT,
      }),
    ).toThrow(/non-success/)
  })
})
