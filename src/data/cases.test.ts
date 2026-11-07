import { describe, it, expect } from 'vitest'
import { CASES } from '@/data/cases'
import { EVIDENCE } from '@/data/evidence'
import { CRYPTIDS } from '@/data/cryptids'

const unique = (xs: string[]): boolean => new Set(xs).size === xs.length
const evidenceIdSet = new Set(EVIDENCE.map((e) => e.id))
const playable = CRYPTIDS.filter((c) => c.mvpStatus === 'playable')

describe('seed data counts and uniqueness', () => {
  it('has exactly 3 cases, 12 evidence items, 5 cryptids', () => {
    expect(CASES).toHaveLength(3)
    expect(EVIDENCE).toHaveLength(12)
    expect(CRYPTIDS).toHaveLength(5)
  })

  it('has unique IDs within each collection', () => {
    expect(unique(CASES.map((c) => c.id))).toBe(true)
    expect(unique(EVIDENCE.map((e) => e.id))).toBe(true)
    expect(unique(CRYPTIDS.map((c) => c.id))).toBe(true)
  })
})

describe('case referential integrity', () => {
  it('every case evidenceId exists and belongs to that case', () => {
    for (const c of CASES) {
      for (const evId of c.evidenceIds) {
        const ev = EVIDENCE.find((e) => e.id === evId)
        expect(ev, `${c.id} references missing ${evId}`).toBeDefined()
        expect(ev?.caseId).toBe(c.id)
      }
    }
  })

  it('every evidence item is referenced by exactly one case', () => {
    for (const ev of EVIDENCE) {
      const refs = CASES.filter((c) => c.evidenceIds.includes(ev.id))
      expect(refs, `${ev.id} reference count`).toHaveLength(1)
    }
  })

  it('every correctCryptidId exists and is playable', () => {
    for (const c of CASES) {
      const cryptid = CRYPTIDS.find((x) => x.id === c.correctCryptidId)
      expect(cryptid, `${c.id} correct cryptid`).toBeDefined()
      expect(cryptid?.mvpStatus).toBe('playable')
    }
  })

  it("each case's correct cryptid evidence set equals the case evidence set", () => {
    for (const c of CASES) {
      const cryptid = CRYPTIDS.find((x) => x.id === c.correctCryptidId)
      expect(new Set(cryptid?.associatedEvidenceIds)).toEqual(new Set(c.evidenceIds))
    }
  })
})

describe('playable cryptids', () => {
  it('has 3 playable cryptids', () => {
    expect(playable).toHaveLength(3)
  })

  it('has valid associated evidence and thresholds', () => {
    for (const c of playable) {
      expect(c.associatedEvidenceIds.length).toBeGreaterThan(0)
      for (const id of c.associatedEvidenceIds) {
        expect(evidenceIdSet.has(id), `${c.id} references missing ${id}`).toBe(true)
      }
      expect(typeof c.minimumThreshold).toBe('number')
      const t = c.minimumThreshold as number
      expect(t).toBeGreaterThanOrEqual(1)
      expect(t).toBeLessThanOrEqual(c.associatedEvidenceIds.length)
    }
  })
})

describe('cryptid explanation data', () => {
  it('every playable cryptid has a non-empty rationale for each associated evidence id and no others', () => {
    for (const c of playable) {
      for (const id of c.associatedEvidenceIds) {
        expect(c.evidenceRationale[id]?.trim().length, `${c.id} ${id}`).toBeGreaterThan(0)
      }
      for (const key of Object.keys(c.evidenceRationale)) {
        expect(c.associatedEvidenceIds, `${c.id} stray ${key}`).toContain(key)
      }
    }
  })

  it('every cryptid has 3+ signature traits', () => {
    for (const c of CRYPTIDS) {
      expect(c.signatureTraits.length, c.id).toBeGreaterThanOrEqual(3)
    }
  })

  it('archive-only cryptids have empty rationale', () => {
    for (const c of CRYPTIDS.filter((x) => x.mvpStatus === 'archive-only')) {
      expect(c.evidenceRationale).toEqual({})
    }
  })
})

describe('archive-only cryptids', () => {
  it.each(['cryptid-004', 'cryptid-005'])('%s is permanently locked', (id) => {
    const c = CRYPTIDS.find((x) => x.id === id)
    expect(c).toBeDefined()
    expect(c?.mvpStatus).toBe('archive-only')
    expect(c?.minimumThreshold).toBeNull()
    expect(c?.associatedEvidenceIds).toEqual([])
  })
})

describe('evidence items', () => {
  it('every item has a non-empty category', () => {
    for (const ev of EVIDENCE) {
      expect(typeof ev.category).toBe('string')
      expect(ev.category.trim().length).toBeGreaterThan(0)
    }
  })
})
