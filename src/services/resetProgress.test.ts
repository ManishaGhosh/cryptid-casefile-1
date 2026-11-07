import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '@/store'
import { flushPendingWrite } from '@/store/middleware/persistenceMiddleware'
import { STORAGE_KEY } from '@/services/persistenceService'
import { resetAllProgress } from './resetProgress'
import { populateStore } from '@/test/populateStore'

describe('resetAllProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('restores defaults and removes the storage key for good', () => {
    populateStore()
    flushPendingWrite()
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()

    resetAllProgress()

    const s = useAppStore.getState()
    expect(s.caseStatuses).toEqual({})
    expect(s.collectedEvidence).toEqual({})
    expect(s.observationNotes).toEqual({})
    expect(s.nodePositions).toEqual({})
    expect(s.connections).toEqual({})
    expect(s.unlockedCryptidIds).toEqual([])
    expect(s.reports).toEqual({})
    expect(s.lastIdentificationResult).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()

    vi.advanceTimersByTime(1000)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
