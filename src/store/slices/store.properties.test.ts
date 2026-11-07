import { describe, it, expect, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { act, renderHook } from '@testing-library/react'
import { useAppStore } from '@/store'
import { useBoardSync } from '@/hooks/useBoardSync'
import { CASES } from '@/data/cases'
import { CRYPTIDS } from '@/data/cryptids'
import { makeConnection } from '@/services/connectionRules'

const NUM_RUNS = 200

const CASE_IDS = CASES.map((c) => c.id)
const EVIDENCE_BY_CASE: Record<string, string[]> = Object.fromEntries(
  CASES.map((c) => [c.id, [...c.evidenceIds]]),
)
const ALL_CASE_EVIDENCE_PAIRS: Array<[string, string]> = CASES.flatMap((c) =>
  c.evidenceIds.map((id): [string, string] => [c.id, id]),
)

function resetStore(): void {
  useAppStore.setState({
    collectedEvidence: {},
    observationNotes: {},
    nodePositions: {},
    connections: {},
    unlockedCryptidIds: [],
  })
}

/** Unordered pair key, direction independent. */
function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|')
}

const casePick = fc.constantFrom(...CASE_IDS)
const collectOps = fc.array(fc.constantFrom(...ALL_CASE_EVIDENCE_PAIRS), { maxLength: 40 })

afterEach(resetStore)

describe('store properties', () => {
  /**
   * Property 3: Evidence Collection Is Idempotent
   * **Validates: Requirements 2.3, 2.4**
   */
  it('P3: interleaved collectEvidence yields per-case distinct first-seen order; repeats are no-ops', () => {
    fc.assert(
      fc.property(collectOps, (ops) => {
        resetStore()
        for (const [caseId, evId] of ops) {
          const before = useAppStore.getState().collectedEvidence
          const alreadyCollected = before[caseId]?.includes(evId) ?? false
          useAppStore.getState().collectEvidence(caseId, evId)
          const after = useAppStore.getState().collectedEvidence
          if (alreadyCollected) {
            expect(after[caseId]).toBe(before[caseId])
          }
        }
        const state = useAppStore.getState().collectedEvidence
        for (const caseId of CASE_IDS) {
          const expected = [
            ...new Set(ops.filter(([c]) => c === caseId).map(([, e]) => e)),
          ]
          expect(state[caseId] ?? []).toEqual(expected)
          for (const id of state[caseId] ?? []) {
            expect(EVIDENCE_BY_CASE[caseId]).toContain(id)
          }
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('P3: collecting for one case never changes other cases', () => {
    fc.assert(
      fc.property(collectOps, casePick, fc.constantFrom(...ALL_CASE_EVIDENCE_PAIRS), (ops, _c, extra) => {
        resetStore()
        for (const [caseId, evId] of ops) useAppStore.getState().collectEvidence(caseId, evId)
        const before = useAppStore.getState().collectedEvidence
        useAppStore.getState().collectEvidence(extra[0], extra[1])
        const after = useAppStore.getState().collectedEvidence
        for (const caseId of CASE_IDS) {
          if (caseId !== extra[0]) expect(after[caseId]).toBe(before[caseId])
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })

  /**
   * Property 4: Observation Note Round Trip
   * **Validates: Requirements 2.4, 2.10**
   */
  it('P4: stored note equals the last note saved per id; untouched ids absent', () => {
    const allIds = ALL_CASE_EVIDENCE_PAIRS.map(([, e]) => e)
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(
            fc.constantFrom(...allIds),
            fc.oneof(fc.string({ maxLength: 200 }), fc.string({ unit: 'binary', maxLength: 200 })),
          ),
          { maxLength: 30 },
        ),
        (saves) => {
          resetStore()
          const last = new Map<string, string>()
          for (const [id, note] of saves) {
            useAppStore.getState().saveObservationNote(id, note)
            last.set(id, note)
          }
          const notes = useAppStore.getState().observationNotes
          expect(Object.keys(notes).sort()).toEqual([...last.keys()].sort())
          for (const [id, note] of last) expect(notes[id]).toBe(note)
        },
      ),
      { numRuns: NUM_RUNS },
    )
  })

  /**
   * Property 5: Investigation Board Self-Loop Rejection (through useBoardSync)
   * **Validates: Requirements 2.5, 2.6**
   */
  it('P5: onConnect with source === target never adds an edge', () => {
    fc.assert(
      fc.property(
        casePick,
        fc.array(fc.nat(3), { minLength: 1, maxLength: 10 }),
        (caseId, picks) => {
          resetStore()
          const ids = EVIDENCE_BY_CASE[caseId]
          for (const id of ids) useAppStore.getState().collectEvidence(caseId, id)
          const { result, unmount } = renderHook(() => useBoardSync(caseId))
          try {
            for (const p of picks) {
              const id = ids[p % ids.length]
              act(() => {
                result.current.onConnect({
                  source: id,
                  target: id,
                  sourceHandle: null,
                  targetHandle: null,
                })
              })
            }
            expect(useAppStore.getState().connections[caseId] ?? []).toEqual([])
          } finally {
            unmount()
          }
        },
      ),
      { numRuns: NUM_RUNS },
    )
  })

  /**
   * Property 6: Investigation Board Duplicate Edge Rejection (through useBoardSync)
   * **Validates: Requirements 2.5, 2.6**
   */
  it('P6: stored edges have unique unordered pairs equal to distinct pairs attempted', () => {
    fc.assert(
      fc.property(
        casePick,
        fc.array(fc.tuple(fc.nat(3), fc.nat(3)), { maxLength: 30 }),
        (caseId, attempts) => {
          resetStore()
          const ids = EVIDENCE_BY_CASE[caseId]
          for (const id of ids) useAppStore.getState().collectEvidence(caseId, id)
          const { result, unmount } = renderHook(() => useBoardSync(caseId))
          try {
            const expected = new Set<string>()
            for (const [i, j] of attempts) {
              const source = ids[i % ids.length]
              const target = ids[j % ids.length]
              if (source !== target) expected.add(pairKey(source, target))
              act(() => {
                result.current.onConnect({
                  source,
                  target,
                  sourceHandle: null,
                  targetHandle: null,
                })
              })
            }
            const edges = useAppStore.getState().connections[caseId] ?? []
            const keys = edges.map((e) => pairKey(e.source, e.target))
            expect(edges.every((e) => e.source !== e.target)).toBe(true)
            expect(new Set(keys).size).toBe(keys.length)
            expect(new Set(keys)).toEqual(expected)
            expect(edges.length).toBe(expected.size)
          } finally {
            unmount()
          }
        },
      ),
      { numRuns: NUM_RUNS },
    )
  })

  describe('board slice', () => {
    it('updateNodePosition: last position wins per key', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(
              fc.constantFrom(...ALL_CASE_EVIDENCE_PAIRS),
              fc.integer({ min: -2000, max: 2000 }),
              fc.integer({ min: -2000, max: 2000 }),
            ),
            { maxLength: 40 },
          ),
          (updates) => {
            resetStore()
            const last = new Map<string, { x: number; y: number }>()
            for (const [[caseId, evId], x, y] of updates) {
              useAppStore.getState().updateNodePosition(caseId, evId, x, y)
              last.set(`${caseId}:${evId}`, { x, y })
            }
            const positions = useAppStore.getState().nodePositions
            expect(Object.keys(positions).sort()).toEqual([...last.keys()].sort())
            for (const [key, pos] of last) expect(positions[key]).toEqual(pos)
          },
        ),
        { numRuns: NUM_RUNS },
      )
    })

    it('removeConnection of a random subset leaves exactly the complement', () => {
      fc.assert(
        fc.property(
          casePick,
          fc.array(fc.boolean(), { minLength: 6, maxLength: 6 }),
          (caseId, removeFlags) => {
            resetStore()
            const ids = EVIDENCE_BY_CASE[caseId]
            const pairs: Array<[string, string]> = []
            for (let i = 0; i < ids.length; i++) {
              for (let j = i + 1; j < ids.length; j++) pairs.push([ids[i], ids[j]])
            }
            for (const [a, b] of pairs) {
              useAppStore.getState().addConnection(caseId, makeConnection(a, b))
            }
            const all = useAppStore.getState().connections[caseId] ?? []
            expect(all).toHaveLength(pairs.length)
            const removed = all.filter((_, i) => removeFlags[i])
            const kept = all.filter((_, i) => !removeFlags[i])
            for (const e of removed) useAppStore.getState().removeConnection(caseId, e.id)
            const remaining = useAppStore.getState().connections[caseId] ?? []
            expect(remaining.map((e) => e.id)).toEqual(kept.map((e) => e.id))
          },
        ),
        { numRuns: NUM_RUNS },
      )
    })

    it('resetBoard(caseId) leaves other cases intact and clears the target case', () => {
      fc.assert(
        fc.property(
          casePick,
          fc.array(fc.constantFrom(...ALL_CASE_EVIDENCE_PAIRS), { maxLength: 12 }),
          (target, positioned) => {
            resetStore()
            for (const [caseId, evId] of positioned) {
              useAppStore.getState().updateNodePosition(caseId, evId, 10, 20)
            }
            for (const caseId of CASE_IDS) {
              const ids = EVIDENCE_BY_CASE[caseId]
              useAppStore.getState().addConnection(caseId, makeConnection(ids[0], ids[1]))
            }
            const before = useAppStore.getState()
            useAppStore.getState().resetBoard(target)
            const after = useAppStore.getState()
            expect(after.connections[target]).toBeUndefined()
            expect(Object.keys(after.nodePositions).some((k) => k.startsWith(`${target}:`))).toBe(
              false,
            )
            for (const caseId of CASE_IDS.filter((c) => c !== target)) {
              expect(after.connections[caseId]).toEqual(before.connections[caseId])
            }
            const otherKeys = Object.keys(before.nodePositions).filter(
              (k) => !k.startsWith(`${target}:`),
            )
            expect(Object.keys(after.nodePositions).sort()).toEqual(otherKeys.sort())
            for (const k of otherKeys) {
              expect(after.nodePositions[k]).toEqual(before.nodePositions[k])
            }
          },
        ),
        { numRuns: NUM_RUNS },
      )
    })
  })

  describe('archive slice', () => {
    /**
     * Note: the slice itself accepts any id, including archive-only cryptids
     * (cryptid-004/005). The permanent-lock guard lives in useIdentification /
     * useArchive, so only dedupe is asserted here.
     * **Validates: Requirements 2.3, 2.4**
     */
    it('unlockCryptid yields a duplicate-free list in first-seen order', () => {
      const cryptidIds = CRYPTIDS.map((c) => c.id)
      fc.assert(
        fc.property(fc.array(fc.constantFrom(...cryptidIds), { maxLength: 30 }), (ids) => {
          resetStore()
          for (const id of ids) useAppStore.getState().unlockCryptid(id)
          const list = useAppStore.getState().unlockedCryptidIds
          expect(new Set(list).size).toBe(list.length)
          expect(list).toEqual([...new Set(ids)])
        }),
        { numRuns: NUM_RUNS },
      )
    })
  })
})
