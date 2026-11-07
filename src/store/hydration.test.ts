import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '@/store'
import { hydrateStore, isHydrated, resetHydrationFlag } from '@/store/hydration'
import { flushPendingWrite, cancelPendingWrite } from '@/store/middleware/persistenceMiddleware'
import {
  STORAGE_KEY,
  CURRENT_SCHEMA_VERSION,
  savePersistedState,
  type PersistableSlice,
} from '@/services/persistenceService'
import { MemoryStorage } from '@/test/memoryStorage'
import type { InvestigationReport } from '@/types/report'

const EMPTY: PersistableSlice = {
  caseStatuses: {},
  collectedEvidence: {},
  observationNotes: {},
  nodePositions: {},
  connections: {},
  unlockedCryptidIds: [],
  reports: {},
}

function report(caseId: string, cryptidId: string): InvestigationReport {
  return {
    caseId,
    caseTitle: 'T',
    filedAt: '2024-01-01T00:00:00.000Z',
    identifiedCryptidId: cryptidId,
    identifiedCryptidName: 'N',
    confidenceScore: 4,
    collectedEvidence: [],
    caseClassification: 'C',
    location: 'L',
    incidentDate: 'D',
    identifiedCryptidClassification: 'CC',
    matchingEvidenceCount: 4,
    totalAssociatedEvidence: 4,
    analysisSummary: 'S',
    connectionCount: 0,
    connectionNotes: [],
  }
}

function persistable(): PersistableSlice {
  const s = useAppStore.getState()
  return {
    caseStatuses: s.caseStatuses,
    collectedEvidence: s.collectedEvidence,
    observationNotes: s.observationNotes,
    nodePositions: s.nodePositions,
    connections: s.connections,
    unlockedCryptidIds: s.unlockedCryptidIds,
    reports: s.reports,
  }
}

describe('hydrateStore', () => {
  beforeEach(() => {
    cancelPendingWrite()
    useAppStore.setState({ ...EMPTY, lastIdentificationResult: null })
    cancelPendingWrite()
    resetHydrationFlag()
  })

  it('restores valid saved state', () => {
    const storage = new MemoryStorage()
    savePersistedState(
      {
        ...EMPTY,
        caseStatuses: { 'case-001': 'in-progress' },
        collectedEvidence: { 'case-001': ['EV-001'] },
        observationNotes: { 'EV-001': 'note' },
      },
      storage
    )
    expect(isHydrated()).toBe(false)
    expect(hydrateStore(storage)).toBe('restored')
    expect(isHydrated()).toBe(true)
    const s = useAppStore.getState()
    expect(s.caseStatuses).toEqual({ 'case-001': 'in-progress' })
    expect(s.collectedEvidence).toEqual({ 'case-001': ['EV-001'] })
    expect(s.observationNotes).toEqual({ 'EV-001': 'note' })
    expect(s.lastIdentificationResult).toBeNull()
    expect(typeof s.setCaseStatus).toBe('function')
  })

  it.each([
    ['missing', null],
    ['corrupt', '{not json'],
    ['wrong-version', JSON.stringify({ ...EMPTY, schemaVersion: '0' })],
  ])('returns fresh for %s data without throwing', (_n, raw) => {
    const storage = new MemoryStorage()
    if (raw !== null) storage.setItem(STORAGE_KEY, raw)
    expect(hydrateStore(storage)).toBe('fresh')
    expect(isHydrated()).toBe(true)
    expect(persistable()).toEqual(EMPTY)
  })

  it('does not overwrite saved data with defaults', () => {
    const storage = new MemoryStorage()
    savePersistedState({ ...EMPTY, caseStatuses: { 'case-002': 'in-progress' } }, storage)
    const before = storage.getItem(STORAGE_KEY)
    hydrateStore(storage)
    flushPendingWrite()
    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}').caseStatuses).toEqual({
      'case-002': 'in-progress',
    })
    expect(before).not.toBeNull()
  })

  it('does not schedule any write when state is fresh', () => {
    const storage = new MemoryStorage()
    hydrateStore(storage)
    flushPendingWrite()
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('downgrades closed without report to identified and unlocks cryptid', () => {
    const storage = new MemoryStorage()
    savePersistedState({ ...EMPTY, caseStatuses: { 'case-001': 'closed' } }, storage)
    hydrateStore(storage)
    const s = useAppStore.getState()
    expect(s.caseStatuses['case-001']).toBe('identified')
    expect(s.unlockedCryptidIds).toContain('cryptid-001')
  })

  it('unlocks the correct cryptid for identified cases and never archive-only ones', () => {
    const storage = new MemoryStorage()
    savePersistedState(
      { ...EMPTY, caseStatuses: { 'case-002': 'identified' }, unlockedCryptidIds: [] },
      storage
    )
    hydrateStore(storage)
    const ids = useAppStore.getState().unlockedCryptidIds
    expect(ids).toContain('cryptid-002')
    expect(ids).not.toContain('cryptid-004')
    expect(ids).not.toContain('cryptid-005')
  })

  it('keeps closed cases that have a report', () => {
    const storage = new MemoryStorage()
    savePersistedState(
      {
        ...EMPTY,
        caseStatuses: { 'case-001': 'closed' },
        unlockedCryptidIds: ['cryptid-001'],
        reports: { 'case-001': report('case-001', 'cryptid-001') },
      },
      storage
    )
    hydrateStore(storage)
    expect(useAppStore.getState().caseStatuses['case-001']).toBe('closed')
  })

  it('discards a report on a case that is not identified or closed', () => {
    const storage = new MemoryStorage()
    savePersistedState(
      {
        ...EMPTY,
        caseStatuses: { 'case-001': 'in-progress' },
        reports: { 'case-001': report('case-001', 'cryptid-001') },
      },
      storage
    )
    hydrateStore(storage)
    expect(useAppStore.getState().reports).toEqual({})
  })

  it('round trips: mutate, flush, reset, hydrate (browser refresh)', () => {
    const storage = new MemoryStorage()
    // Route the pending debounced write to our storage by saving explicitly after mutation.
    useAppStore.getState().setCaseStatus('case-003', 'in-progress')
    savePersistedState(persistable(), storage)
    cancelPendingWrite()
    const expected = persistable()

    useAppStore.setState({ ...EMPTY })
    cancelPendingWrite()
    expect(useAppStore.getState().caseStatuses).toEqual({})

    expect(hydrateStore(storage)).toBe('restored')
    expect(persistable()).toEqual(expected)
  })

  it('round trips through default localStorage via flushPendingWrite', () => {
    useAppStore.getState().setCaseStatus('case-003', 'in-progress')
    flushPendingWrite()
    const raw = window.localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw ?? '{}').schemaVersion).toBe(CURRENT_SCHEMA_VERSION)

    useAppStore.setState({ ...EMPTY })
    cancelPendingWrite()
    expect(hydrateStore()).toBe('restored')
    expect(useAppStore.getState().caseStatuses).toEqual({ 'case-003': 'in-progress' })
  })
})
