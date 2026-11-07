import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { CASES } from '@/data/cases'
import { CRYPTIDS } from '@/data/cryptids'
import { EVIDENCE } from '@/data/evidence'
import type { Case } from '@/types/domain'
import { runIdentification } from './identificationEngine'
import { calculateConfidenceScore } from './scoreCalculator'

const NUM_RUNS = 200
const ALL_EVIDENCE_IDS = EVIDENCE.map((e) => e.id)
const EVIDENCE_NAMES = new Set(EVIDENCE.map((e) => e.name))

const caseArb = fc.constantFrom(...CASES)
const cryptidIdArb = fc.constantFrom(...CRYPTIDS.map((c) => c.id))

/** Shuffled subset of all 12 ids, optionally with duplicates mixed in. */
const evidenceListArb = fc
  .tuple(
    fc.subarray(ALL_EVIDENCE_IDS).chain((s) => fc.shuffledSubarray(s, { minLength: s.length })),
    fc.array(fc.constantFrom(...ALL_EVIDENCE_IDS), { maxLength: 6 }),
  )
  .map(([subset, extras]) => [...subset, ...extras])

function run(caseData: Case, cryptidId: string, ids: readonly string[]) {
  return runIdentification({
    caseData,
    submittedCryptidId: cryptidId,
    collectedEvidenceIds: ids,
    cryptids: CRYPTIDS,
    evidence: EVIDENCE,
  })
}

describe('identification properties', () => {
  it('Property 1: confidence score is always an integer in [0, 100]', () => {
    // **Validates: Requirements CI-002**
    const check = (m: number, t: number): void => {
      const s = calculateConfidenceScore(m, t)
      expect(Number.isInteger(s)).toBe(true)
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThanOrEqual(100)
    }
    fc.assert(
      fc.property(fc.integer({ min: -20, max: 100 }), fc.integer({ min: -5, max: 100 }), check),
      { numRuns: NUM_RUNS },
    )
    fc.assert(fc.property(fc.double({ noNaN: false }), fc.double({ noNaN: false }), check), {
      numRuns: NUM_RUNS,
    })
    fc.assert(
      fc.property(
        fc.oneof(fc.double(), fc.constantFrom(NaN, Infinity, -Infinity, 0, -0)),
        fc.oneof(fc.integer({ min: -5, max: 100 }), fc.constantFrom(NaN, Infinity, -Infinity)),
        check,
      ),
      { numRuns: NUM_RUNS },
    )
  })

  it('Property 2: a wrong cryptid is always inconclusive', () => {
    // **Validates: Requirements CI-003, IR-003**
    fc.assert(
      fc.property(caseArb, cryptidIdArb, evidenceListArb, (c, id, ids) => {
        fc.pre(id !== c.correctCryptidId)
        const r = run(c, id, ids)
        expect(r.outcome).toBe('inconclusive')
        expect(r.evidenceNeeded).toBe(0)
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('Property 3: success iff correct suspect and matching >= threshold', () => {
    // **Validates: Requirements CI-003, IR-003**
    fc.assert(
      fc.property(caseArb, cryptidIdArb, evidenceListArb, (c, id, ids) => {
        const r = run(c, id, ids)
        const cryptid = CRYPTIDS.find((x) => x.id === id)!
        const threshold = cryptid.minimumThreshold
        const expectSuccess =
          id === c.correctCryptidId && threshold !== null && r.matchingEvidenceCount >= threshold
        expect(r.outcome === 'success').toBe(expectSuccess)
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('Property 4: adding case evidence never lowers score or downgrades success', () => {
    // **Validates: Requirements CI-002, CI-003**
    fc.assert(
      fc.property(caseArb, evidenceListArb, fc.nat(), (c, ids, pick) => {
        const extra = c.evidenceIds[pick % c.evidenceIds.length]
        const before = run(c, c.correctCryptidId, ids)
        const after = run(c, c.correctCryptidId, [...ids, extra])
        expect(after.confidenceScore).toBeGreaterThanOrEqual(before.confidenceScore)
        expect(after.matchingEvidenceCount).toBeGreaterThanOrEqual(before.matchingEvidenceCount)
        if (before.outcome === 'success') expect(after.outcome).toBe('success')
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('Property 5: assessments cover exactly the distinct known ids; no names in missingCategories', () => {
    // **Validates: Requirements CI-002**
    fc.assert(
      fc.property(caseArb, cryptidIdArb, evidenceListArb, (c, id, ids) => {
        const r = run(c, id, ids)
        const assessed = r.assessments.map((a) => a.evidenceId)
        expect(new Set(assessed).size).toBe(assessed.length)
        expect([...assessed].sort()).toEqual([...new Set(ids)].sort())
        for (const cat of r.missingCategories) expect(EVIDENCE_NAMES.has(cat)).toBe(false)
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('Property 6: the engine is deterministic', () => {
    // **Validates: Requirements CI-003**
    fc.assert(
      fc.property(caseArb, cryptidIdArb, evidenceListArb, (c, id, ids) => {
        expect(run(c, id, ids)).toEqual(run(c, id, ids))
      }),
      { numRuns: NUM_RUNS },
    )
  })
})
