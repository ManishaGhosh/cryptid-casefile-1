import { describe, it, expect } from 'vitest'
import { isValidPersistedShape, sanitizePersistedState } from './validationService'
import type { PersistedState } from '@/types/persistence'

function valid(): PersistedState {
  return {
    schemaVersion: '1',
    caseStatuses: { 'case-001': 'in-progress' },
    collectedEvidence: { 'case-001': ['EV-001'] },
    observationNotes: { 'EV-001': 'note' },
    nodePositions: { 'case-001:EV-001': { x: 1, y: 2 } },
    connections: { 'case-001': [{ id: 'e1', source: 'EV-001', target: 'EV-002' }] },
    unlockedCryptidIds: ['cryptid-001'],
    reports: {},
  }
}

describe('isValidPersistedShape', () => {
  it('accepts a valid state', () => {
    expect(isValidPersistedShape(valid())).toBe(true)
  })

  it.each([[[]], [null], [42], ['x'], [{}]])('rejects %j', (input) => {
    expect(isValidPersistedShape(input)).toBe(false)
  })

  it('rejects bad status, NaN position, bad connection, bad array', () => {
    expect(isValidPersistedShape({ ...valid(), caseStatuses: { a: 'bogus' } })).toBe(false)
    expect(
      isValidPersistedShape({ ...valid(), nodePositions: { a: { x: NaN, y: 0 } } })
    ).toBe(false)
    expect(isValidPersistedShape({ ...valid(), connections: { a: [{ id: 1 }] } })).toBe(false)
    expect(isValidPersistedShape({ ...valid(), unlockedCryptidIds: [1] })).toBe(false)
  })
})

describe('sanitizePersistedState', () => {
  it('drops unknown ids and dedupes', () => {
    const dirty: PersistedState = {
      ...valid(),
      caseStatuses: { 'case-001': 'new', 'case-999': 'closed' },
      collectedEvidence: { 'case-001': ['EV-001', 'EV-001', 'EV-999'], 'case-999': ['EV-001'] },
      observationNotes: { 'EV-001': 'a', 'EV-999': 'b' },
      nodePositions: { 'case-001:EV-001': { x: 0, y: 0 }, 'case-001:EV-999': { x: 0, y: 0 } },
      connections: {
        'case-001': [
          { id: 'e1', source: 'EV-001', target: 'EV-002' },
          { id: 'e1', source: 'EV-001', target: 'EV-002' },
          { id: 'e2', source: 'EV-001', target: 'EV-999' },
        ],
      },
      unlockedCryptidIds: ['cryptid-001', 'cryptid-001', 'cryptid-999'],
    }
    const out = sanitizePersistedState(
      dirty,
      ['case-001'],
      ['EV-001', 'EV-002'],
      ['cryptid-001']
    )
    expect(out.caseStatuses).toEqual({ 'case-001': 'new' })
    expect(out.collectedEvidence).toEqual({ 'case-001': ['EV-001'] })
    expect(out.observationNotes).toEqual({ 'EV-001': 'a' })
    expect(Object.keys(out.nodePositions)).toEqual(['case-001:EV-001'])
    expect(out.connections['case-001']).toHaveLength(1)
    expect(out.unlockedCryptidIds).toEqual(['cryptid-001'])
  })
})
