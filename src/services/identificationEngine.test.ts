import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { CASES } from '@/data/cases'
import { CRYPTIDS } from '@/data/cryptids'
import { EVIDENCE } from '@/data/evidence'
import { runIdentification, computeMissingCategories } from './identificationEngine'

const case1 = CASES.find((c) => c.id === 'case-001')!
const warden = CRYPTIDS.find((c) => c.id === 'cryptid-001')!

function run(caseId: string, cryptidId: string, ids: string[]) {
  const caseData = CASES.find((c) => c.id === caseId)!
  return runIdentification({
    caseData,
    submittedCryptidId: cryptidId,
    collectedEvidenceIds: ids,
    cryptids: CRYPTIDS,
    evidence: EVIDENCE,
  })
}

describe('runIdentification', () => {
  it('succeeds with 3 of 4 evidence and returns seed rationales', () => {
    const r = run('case-001', 'cryptid-001', ['EV-001', 'EV-002', 'EV-003'])
    expect(r.outcome).toBe('success')
    expect(r.confidenceScore).toBe(75)
    expect(r.matchingEvidenceCount).toBe(3)
    expect(r.requiredCount).toBe(3)
    expect(r.evidenceNeeded).toBe(0)
    expect(r.submittedCryptidName).toBe('The Warden')
    expect(r.assessments).toHaveLength(3)
    for (const a of r.assessments) {
      expect(a.supportsSuspect).toBe(true)
      expect(a.explanation).toBe(warden.evidenceRationale[a.evidenceId])
    }
    expect(r.summary).toBe('3 of 4 evidence items corroborate The Warden.')
  })

  it('succeeds with 100 for all 4', () => {
    const r = run('case-001', 'cryptid-001', ['EV-001', 'EV-002', 'EV-003', 'EV-004'])
    expect(r.outcome).toBe('success')
    expect(r.confidenceScore).toBe(100)
  })

  it('reports insufficient evidence with distinct missing categories, not names', () => {
    const r = run('case-001', 'cryptid-001', ['EV-001', 'EV-002'])
    expect(r.outcome).toBe('insufficient-evidence')
    expect(r.evidenceNeeded).toBe(1)
    const expected = [
      ...new Set(
        warden.associatedEvidenceIds
          .filter((id) => !['EV-001', 'EV-002'].includes(id))
          .map((id) => EVIDENCE.find((e) => e.id === id)!.category),
      ),
    ]
    expect(r.missingCategories).toEqual(expected)
    const names = EVIDENCE.map((e) => e.name)
    for (const c of r.missingCategories) expect(names).not.toContain(c)
    expect(r.summary).toContain('1 more corroborating item is required')
  })

  it('is inconclusive for the wrong cryptid with every assessment unsupported', () => {
    const r = run('case-001', 'cryptid-002', ['EV-001', 'EV-002', 'EV-003', 'EV-004'])
    expect(r.outcome).toBe('inconclusive')
    expect(r.assessments).toHaveLength(4)
    expect(r.assessments.every((a) => !a.supportsSuspect)).toBe(true)
    expect(r.assessments[0].explanation).toBe(
      'Nothing in the dossier for The Hollow accounts for broken branches (Physical Trace).',
    )
    expect(r.missingCategories).toEqual([])
    expect(r.evidenceNeeded).toBe(0)
  })

  it('is inconclusive with score 0 for archive-only cryptid', () => {
    const r = run('case-001', 'cryptid-004', ['EV-001', 'EV-002', 'EV-003', 'EV-004'])
    expect(r.outcome).toBe('inconclusive')
    expect(r.confidenceScore).toBe(0)
  })

  it('returns unknown-entity for an unknown id', () => {
    const r = run('case-001', 'cryptid-999', ['EV-001'])
    expect(r.outcome).toBe('unknown-entity')
    expect(r.confidenceScore).toBe(0)
    expect(r.assessments).toEqual([])
  })

  it('dedupes collected ids', () => {
    const r = run('case-001', 'cryptid-001', ['EV-001', 'EV-001', 'EV-002', 'EV-003'])
    expect(r.matchingEvidenceCount).toBe(3)
    expect(r.assessments).toHaveLength(3)
  })

  it('does not mutate inputs', () => {
    const ids = ['EV-001', 'EV-002']
    const idsCopy = [...ids]
    const cryptidsCopy = JSON.stringify(CRYPTIDS)
    const evidenceCopy = JSON.stringify(EVIDENCE)
    const caseCopy = JSON.stringify(case1)
    run('case-001', 'cryptid-001', ids)
    expect(ids).toEqual(idsCopy)
    expect(JSON.stringify(CRYPTIDS)).toBe(cryptidsCopy)
    expect(JSON.stringify(EVIDENCE)).toBe(evidenceCopy)
    expect(JSON.stringify(case1)).toBe(caseCopy)
  })
})

describe('runIdentification audit cases', () => {
  it('wrong cryptid with all 4 case items is inconclusive with neutral status fields', () => {
    for (const caseData of CASES) {
      const wrong = CRYPTIDS.find((c) => c.id !== caseData.correctCryptidId && c.mvpStatus === 'playable')!
      const r = run(caseData.id, wrong.id, [...caseData.evidenceIds])
      expect(r.outcome).toBe('inconclusive')
      expect(r.evidenceNeeded).toBe(0)
      expect(r.missingCategories).toEqual([])
    }
  })

  it('every playable case succeeds at 100 with its correct cryptid and all 4 items', () => {
    for (const caseData of CASES) {
      expect(caseData.evidenceIds).toHaveLength(4)
      const r = run(caseData.id, caseData.correctCryptidId, [...caseData.evidenceIds])
      expect(r.outcome).toBe('success')
      expect(r.confidenceScore).toBe(100)
      expect(r.matchingEvidenceCount).toBe(4)
    }
  })

  it('insufficient-evidence always has non-empty missingCategories (below threshold)', () => {
    for (const caseData of CASES) {
      const r = run(caseData.id, caseData.correctCryptidId, [caseData.evidenceIds[0]])
      expect(r.outcome).toBe('insufficient-evidence')
      expect(r.missingCategories.length).toBeGreaterThan(0)
      expect(r.evidenceNeeded).toBeGreaterThan(0)
    }
    const none = run('case-001', 'cryptid-001', [])
    expect(none.outcome).toBe('insufficient-evidence')
    expect(none.missingCategories.length).toBeGreaterThan(0)
  })

  it('summaries never contain a doubled article for any cryptid or outcome', () => {
    const doubled = /\bthe\s+the\b/i
    for (const cryptid of CRYPTIDS) {
      for (const caseData of CASES) {
        for (const ids of [[], [...caseData.evidenceIds.slice(0, 2)], [...caseData.evidenceIds]]) {
          const r = run(caseData.id, cryptid.id, ids)
          expect(r.summary).not.toMatch(doubled)
          for (const a of r.assessments) expect(a.explanation).not.toMatch(doubled)
        }
      }
    }
    expect(run('case-001', 'cryptid-999', []).summary).not.toMatch(doubled)
  })
})

describe('computeMissingCategories', () => {
  it('returns distinct categories of uncollected associated evidence in seed order', () => {
    expect(computeMissingCategories(['EV-001', 'EV-002', 'EV-003', 'EV-004'], ['EV-002'], EVIDENCE)).toEqual([
      'Physical Trace',
      'Biological',
    ])
  })
})

const allIds = EVIDENCE.map((e) => e.id)
const subsetArb = fc.subarray(allIds)

describe('identification properties', () => {
  // Property 2: Wrong Cryptid Always Inconclusive
  // **Validates: Requirements CI-002, AC-CI-002**
  it('wrong cryptid is always inconclusive', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CASES),
        fc.constantFrom(...CRYPTIDS),
        subsetArb,
        (caseData, cryptid, ids) => {
          fc.pre(cryptid.id !== caseData.correctCryptidId)
          const r = runIdentification({
            caseData,
            submittedCryptidId: cryptid.id,
            collectedEvidenceIds: ids,
            cryptids: CRYPTIDS,
            evidence: EVIDENCE,
          })
          expect(r.outcome).toBe('inconclusive')
        },
      ),
    )
  })

  // **Validates: Requirements CI-003, AC-CI-003**
  it("'success' only if correct cryptid and matching >= threshold", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CASES),
        fc.constantFrom(...CRYPTIDS),
        subsetArb,
        (caseData, cryptid, ids) => {
          const r = runIdentification({
            caseData,
            submittedCryptidId: cryptid.id,
            collectedEvidenceIds: ids,
            cryptids: CRYPTIDS,
            evidence: EVIDENCE,
          })
          const shouldSucceed =
            cryptid.id === caseData.correctCryptidId &&
            cryptid.minimumThreshold !== null &&
            r.matchingEvidenceCount >= cryptid.minimumThreshold
          expect(r.outcome === 'success').toBe(shouldSucceed)
        },
      ),
    )
  })
})
