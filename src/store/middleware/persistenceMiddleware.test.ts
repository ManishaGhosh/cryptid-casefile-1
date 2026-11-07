import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { create } from 'zustand'
import { createCaseSlice } from '../slices/caseSlice'
import { createEvidenceSlice } from '../slices/evidenceSlice'
import { createBoardSlice } from '../slices/boardSlice'
import { createArchiveSlice } from '../slices/archiveSlice'
import { createReportSlice } from '../slices/reportSlice'
import type { AppStore } from '../index'
import { MemoryStorage } from '@/test/memoryStorage'
import { STORAGE_KEY } from '@/services/persistenceService'
import {
  attachPersistence,
  cancelPendingWrite,
  flushPendingWrite,
  WRITE_DEBOUNCE_MS,
} from './persistenceMiddleware'

function makeStore(storage: Storage) {
  const store = create<AppStore>()((...a) => ({
    ...createCaseSlice(...a),
    ...createEvidenceSlice(...a),
    ...createBoardSlice(...a),
    ...createArchiveSlice(...a),
    ...createReportSlice(...a),
  }))
  const detach = attachPersistence(store, { storage })
  return { store, detach }
}

describe('persistenceMiddleware', () => {
  let storage: MemoryStorage
  let detach: () => void

  beforeEach(() => {
    vi.useFakeTimers()
    storage = new MemoryStorage()
  })
  afterEach(() => {
    detach?.()
    cancelPendingWrite()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('writes 500ms after collectEvidence, not before', () => {
    const made = makeStore(storage)
    detach = made.detach
    made.store.getState().collectEvidence('case-001', 'ev-001')
    vi.advanceTimersByTime(WRITE_DEBOUNCE_MS - 1)
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
    vi.advanceTimersByTime(1)
    const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}') as {
      collectedEvidence: Record<string, string[]>
    }
    expect(saved.collectedEvidence['case-001']).toEqual(['ev-001'])
  })

  it('coalesces rapid mutations into one write with the latest state', () => {
    const made = makeStore(storage)
    detach = made.detach
    const spy = vi.spyOn(storage, 'setItem')
    const s = made.store.getState()
    s.collectEvidence('case-001', 'ev-001')
    vi.advanceTimersByTime(200)
    s.collectEvidence('case-001', 'ev-002')
    vi.advanceTimersByTime(200)
    s.saveObservationNote('ev-001', 'note')
    vi.advanceTimersByTime(WRITE_DEBOUNCE_MS)
    expect(spy).toHaveBeenCalledTimes(1)
    const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}') as {
      collectedEvidence: Record<string, string[]>
      observationNotes: Record<string, string>
    }
    expect(saved.collectedEvidence['case-001']).toEqual(['ev-001', 'ev-002'])
    expect(saved.observationNotes['ev-001']).toBe('note')
  })

  it('does not write for setLastIdentificationResult', () => {
    const made = makeStore(storage)
    detach = made.detach
    made.store.getState().setLastIdentificationResult(null)
    vi.advanceTimersByTime(WRITE_DEBOUNCE_MS * 2)
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('does not write when re-collecting an already collected item', () => {
    const made = makeStore(storage)
    detach = made.detach
    made.store.getState().collectEvidence('case-001', 'ev-001')
    flushPendingWrite()
    storage.clear()
    made.store.getState().collectEvidence('case-001', 'ev-001')
    vi.advanceTimersByTime(WRITE_DEBOUNCE_MS * 2)
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('flushPendingWrite writes immediately; cancelPendingWrite prevents it', () => {
    const made = makeStore(storage)
    detach = made.detach
    made.store.getState().collectEvidence('case-001', 'ev-001')
    flushPendingWrite()
    expect(storage.getItem(STORAGE_KEY)).not.toBeNull()

    storage.clear()
    made.store.getState().collectEvidence('case-001', 'ev-002')
    cancelPendingWrite()
    vi.advanceTimersByTime(WRITE_DEBOUNCE_MS * 2)
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('does not throw when storage throws; in-memory state still updates', () => {
    const made = makeStore(storage)
    detach = made.detach
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    made.store.getState().collectEvidence('case-001', 'ev-001')
    expect(() => vi.advanceTimersByTime(WRITE_DEBOUNCE_MS)).not.toThrow()
    expect(made.store.getState().collectedEvidence['case-001']).toEqual(['ev-001'])
    expect(warn).toHaveBeenCalled()
  })
})
