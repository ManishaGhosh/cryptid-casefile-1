import { describe, it, expect, vi, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { MemoryStorage } from '@/test/memoryStorage'
import { CASES } from '@/data/cases'
import { EVIDENCE } from '@/data/evidence'
import { CRYPTIDS } from '@/data/cryptids'
import type { PersistedState } from '@/types/persistence'
import type { InvestigationReport } from '@/types/report'
import { isValidPersistedShape } from './validationService'
import {
  STORAGE_KEY,
  CURRENT_SCHEMA_VERSION,
  loadPersistedState,
  savePersistedState,
  type PersistableSlice,
} from './persistenceService'

const RUNS = { numRuns: 200 }
const STATUSES = ['new', 'in-progress', 'identified', 'closed'] as const

const CASE_IDS = new Set(CASES.map((c) => c.id))
const EVIDENCE_IDS = new Set(EVIDENCE.map((e) => e.id))
const CRYPTID_IDS = new Set(CRYPTIDS.map((c) => c.id))

function isNotJson(s: string): boolean {
  try {
    JSON.parse(s)
    return false
  } catch {
    return true
  }
}

function storageWith(raw: string): MemoryStorage {
  const s = new MemoryStorage()
  s.setItem(STORAGE_KEY, raw)
  return s
}

afterEach(() => {
  vi.restoreAllMocks()
})

function silenceWarn(): void {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
}

// ---------- Arbitraries over real seed data ----------

const finite = fc.double({ noNaN: true, noDefaultInfinity: true, min: -1e6, max: 1e6 }).map((n) => n + 0)

function reportFor(caseId: string): InvestigationReport {
  return {
    caseId,
    caseTitle: 't',
    filedAt: '2024-01-01T00:00:00.000Z',
    identifiedCryptidId: 'cryptid-001',
    identifiedCryptidName: 'n',
    confidenceScore: 50,
    collectedEvidence: [],
    caseClassification: 'c',
    location: 'l',
    incidentDate: 'd',
    identifiedCryptidClassification: 'c',
    matchingEvidenceCount: 0,
    totalAssociatedEvidence: 0,
    analysisSummary: 's',
    connectionCount: 0,
    connectionNotes: [],
  }
}

const MAX_EV = Math.max(...CASES.map((c) => c.evidenceIds.length))

const perCaseArb = fc.record({
  status: fc.constantFrom(...STATUSES),
  collectedIdx: fc.subarray(Array.from({ length: MAX_EV }, (_, i) => i)),
  notes: fc.array(fc.string({ maxLength: 200 }), { minLength: MAX_EV, maxLength: MAX_EV }),
  positions: fc.array(fc.tuple(finite, finite), { minLength: MAX_EV, maxLength: MAX_EV }),
  edges: fc.array(fc.record({ a: fc.nat({ max: 3 }), b: fc.nat({ max: 2 }) }), { maxLength: 5 }),
  hasReport: fc.boolean(),
})

const validSliceArb: fc.Arbitrary<PersistableSlice> = fc
  .tuple(
    fc.array(perCaseArb, { minLength: CASES.length, maxLength: CASES.length }),
    fc.subarray([...CRYPTIDS.map((c) => c.id)])
  )
  .map(([perCase, unlocked]) => {
    const slice: PersistableSlice = {
      caseStatuses: {},
      collectedEvidence: {},
      observationNotes: {},
      nodePositions: {},
      connections: {},
      unlockedCryptidIds: unlocked,
      reports: {},
    }
    perCase.forEach((p, i) => {
      const c = CASES[i]
      slice.caseStatuses[c.id] = p.status
      const collected = p.collectedIdx
        .filter((n) => n < c.evidenceIds.length)
        .map((n) => c.evidenceIds[n])
      slice.collectedEvidence[c.id] = collected
      collected.forEach((evId) => {
        const idx = c.evidenceIds.indexOf(evId)
        slice.observationNotes[evId] = p.notes[idx]
        slice.nodePositions[`${c.id}:${evId}`] = { x: p.positions[idx][0], y: p.positions[idx][1] }
      })
      slice.connections[c.id] = p.edges.map((e, n) => {
        const source = c.evidenceIds[e.a]
        const target = c.evidenceIds[(e.a + 1 + e.b) % c.evidenceIds.length]
        return { id: `e-${n}`, source, target }
      })
      if (p.hasReport) slice.reports[c.id] = reportFor(c.id)
    })
    return slice
  })

const realOrFake = (real: string[], fake: string[]): fc.Arbitrary<string> =>
  fc.oneof(fc.constantFrom(...real), fc.constantFrom(...fake))

const mixedCaseId = realOrFake([...CASE_IDS], ['case-999', 'x', ''])
const mixedEvId = realOrFake([...EVIDENCE_IDS], ['EV-999', 'ghost', ''])
const mixedCryptidId = realOrFake([...CRYPTID_IDS], ['cryptid-999', 'nope'])

const mixedStateArb = fc.record({
  caseStatuses: fc.dictionary(mixedCaseId, fc.constantFrom(...STATUSES)),
  collectedEvidence: fc.dictionary(mixedCaseId, fc.array(mixedEvId, { maxLength: 8 })),
  observationNotes: fc.dictionary(mixedEvId, fc.string({ maxLength: 20 })),
  nodePositions: fc.dictionary(
    fc.tuple(mixedCaseId, mixedEvId).map(([c, e]) => `${c}:${e}`),
    fc.record({ x: finite, y: finite })
  ),
  connections: fc.dictionary(
    mixedCaseId,
    fc.array(
      fc.record({
        id: fc.constantFrom('e1', 'e2', 'e3'),
        source: mixedEvId,
        target: mixedEvId,
      }),
      { maxLength: 6 }
    )
  ),
  unlockedCryptidIds: fc.array(mixedCryptidId, { maxLength: 8 }),
  reports: fc.dictionary(
    mixedCaseId,
    mixedCaseId.map((caseId) => ({ caseId }))
  ),
})

describe('persistence properties', () => {
  /** **Validates: Requirements PT-004, EV-006** */
  it('Property 7: non-JSON strings never throw and yield null', () => {
    silenceWarn()
    fc.assert(
      fc.property(
        fc.oneof(fc.string(), fc.fullUnicodeString()).filter(isNotJson),
        (raw) => {
          const storage = storageWith(raw)
          expect(() => loadPersistedState(storage)).not.toThrow()
          expect(loadPersistedState(storage)).toBeNull()
        }
      ),
      RUNS
    )
  })

  /** **Validates: Requirements PT-004, EV-006** */
  it('Property 7b: valid JSON with invalid shape yields null without throwing', () => {
    silenceWarn()
    fc.assert(
      fc.property(
        fc.jsonValue().filter((v) => !isValidPersistedShape(v)),
        (value) => {
          const storage = storageWith(JSON.stringify(value))
          expect(() => loadPersistedState(storage)).not.toThrow()
          expect(loadPersistedState(storage)).toBeNull()
        }
      ),
      RUNS
    )
  })

  /** **Validates: Requirements PT-004, EV-006** */
  it('Property 7c: wrong schema version yields null and removes the key', () => {
    silenceWarn()
    fc.assert(
      fc.property(
        validSliceArb,
        fc.string().filter((v) => v !== CURRENT_SCHEMA_VERSION),
        (slice, version) => {
          const storage = storageWith(JSON.stringify({ ...slice, schemaVersion: version }))
          expect(loadPersistedState(storage)).toBeNull()
          expect(storage.getItem(STORAGE_KEY)).toBeNull()
        }
      ),
      RUNS
    )
  })

  /** **Validates: Requirements PT-004, EV-006** */
  it('Property 8: save then load round-trips valid seed-id states', () => {
    silenceWarn()
    fc.assert(
      fc.property(validSliceArb, (slice) => {
        const storage = new MemoryStorage()
        expect(savePersistedState(slice, storage)).toBe(true)
        const loaded = loadPersistedState(storage)
        const expected: PersistedState = { schemaVersion: CURRENT_SCHEMA_VERSION, ...slice }
        expect(loaded).toEqual(expected)
      }),
      RUNS
    )
  })

  /** **Validates: Requirements PT-004, EV-006** */
  it('Property 9: sanitising only keeps known ids that existed in the input', () => {
    silenceWarn()
    fc.assert(
      fc.property(mixedStateArb, (input) => {
        const storage = storageWith(
          JSON.stringify({ schemaVersion: CURRENT_SCHEMA_VERSION, ...input })
        )
        const out = loadPersistedState(storage)
        expect(out).not.toBeNull()
        if (!out) return

        for (const k of Object.keys(out.caseStatuses)) {
          expect(CASE_IDS.has(k)).toBe(true)
          expect(out.caseStatuses[k]).toBe(input.caseStatuses[k])
        }
        for (const [k, ids] of Object.entries(out.collectedEvidence)) {
          expect(CASE_IDS.has(k)).toBe(true)
          expect(k in input.collectedEvidence).toBe(true)
          for (const id of ids) {
            expect(EVIDENCE_IDS.has(id)).toBe(true)
            expect(input.collectedEvidence[k]).toContain(id)
          }
          expect(new Set(ids).size).toBe(ids.length)
        }
        for (const [k, v] of Object.entries(out.observationNotes)) {
          expect(EVIDENCE_IDS.has(k)).toBe(true)
          expect(input.observationNotes[k]).toBe(v)
        }
        for (const [k, v] of Object.entries(out.nodePositions)) {
          const [c, e] = k.split(':')
          expect(CASE_IDS.has(c)).toBe(true)
          expect(EVIDENCE_IDS.has(e)).toBe(true)
          expect(input.nodePositions[k]).toEqual(v)
        }
        for (const [k, edges] of Object.entries(out.connections)) {
          expect(CASE_IDS.has(k)).toBe(true)
          const inputEdges = input.connections[k].map((e) => JSON.stringify(e))
          for (const e of edges) {
            expect(EVIDENCE_IDS.has(e.source)).toBe(true)
            expect(EVIDENCE_IDS.has(e.target)).toBe(true)
            expect(inputEdges).toContain(JSON.stringify(e))
          }
          expect(new Set(edges.map((e) => e.id)).size).toBe(edges.length)
        }
        for (const id of out.unlockedCryptidIds) {
          expect(CRYPTID_IDS.has(id)).toBe(true)
          expect(input.unlockedCryptidIds).toContain(id)
        }
        expect(new Set(out.unlockedCryptidIds).size).toBe(out.unlockedCryptidIds.length)
        for (const [k, r] of Object.entries(out.reports)) {
          expect(CASE_IDS.has(k)).toBe(true)
          expect(CASE_IDS.has(r.caseId)).toBe(true)
          expect(input.reports[k]).toEqual(r)
        }
      }),
      RUNS
    )
  })

  /** **Validates: Requirements PT-004, EV-006** */
  it('Property 10: load is total for arbitrary JSON content', () => {
    silenceWarn()
    fc.assert(
      fc.property(fc.anything(), (value) => {
        let raw: string | undefined
        try {
          raw = JSON.stringify(value)
        } catch {
          return // not serialisable; nothing to store
        }
        if (raw === undefined) return
        const storage = storageWith(raw)
        let result: PersistedState | null = null
        expect(() => {
          result = loadPersistedState(storage)
        }).not.toThrow()
        expect(result === null || isValidPersistedShape(result)).toBe(true)
      }),
      RUNS
    )
  })
})
