import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { useAppStore } from '../index'

describe('evidenceSlice', () => {
  beforeEach(() => {
    useAppStore.setState({ collectedEvidence: {}, observationNotes: {} })
  })

  it('collectEvidence adds the ID to the case set', () => {
    useAppStore.getState().collectEvidence('case-001', 'EV-001')
    expect(useAppStore.getState().collectedEvidence['case-001']).toEqual(['EV-001'])
  })

  it('collectEvidence is idempotent and does not change state on repeat', () => {
    useAppStore.getState().collectEvidence('case-001', 'EV-001')
    const first = useAppStore.getState().collectedEvidence['case-001']
    useAppStore.getState().collectEvidence('case-001', 'EV-001')
    const second = useAppStore.getState().collectedEvidence['case-001']
    expect(second).toEqual(['EV-001'])
    expect(second).toBe(first)
  })

  it('keeps evidence for different cases separate', () => {
    useAppStore.getState().collectEvidence('case-001', 'EV-001')
    useAppStore.getState().collectEvidence('case-002', 'EV-005')
    const { collectedEvidence } = useAppStore.getState()
    expect(collectedEvidence['case-001']).toEqual(['EV-001'])
    expect(collectedEvidence['case-002']).toEqual(['EV-005'])
  })

  it('saveObservationNote stores under the evidence id and overwrites', () => {
    useAppStore.getState().saveObservationNote('EV-001', 'first')
    expect(useAppStore.getState().observationNotes['EV-001']).toBe('first')
    useAppStore.getState().saveObservationNote('EV-001', 'second')
    expect(useAppStore.getState().observationNotes).toEqual({ 'EV-001': 'second' })
  })

  it('resetAllEvidence clears collected evidence and notes', () => {
    useAppStore.getState().collectEvidence('case-001', 'EV-001')
    useAppStore.getState().saveObservationNote('EV-001', 'note')
    useAppStore.getState().resetAllEvidence()
    const state = useAppStore.getState()
    expect(state.collectedEvidence).toEqual({})
    expect(state.observationNotes).toEqual({})
  })

  it('property: stored array has no duplicates, in first-seen order', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('EV-001', 'EV-002', 'EV-003', 'EV-004')),
        (ids) => {
          useAppStore.setState({ collectedEvidence: {}, observationNotes: {} })
          for (const id of ids) useAppStore.getState().collectEvidence('case-001', id)
          const stored = useAppStore.getState().collectedEvidence['case-001'] ?? []
          expect(new Set(stored).size).toBe(stored.length)
          expect(stored).toEqual([...new Set(ids)])
        },
      ),
    )
  })
})
