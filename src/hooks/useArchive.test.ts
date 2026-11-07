import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAppStore } from '@/store'
import { useArchive } from './useArchive'

beforeEach(() => {
  useAppStore.setState({ unlockedCryptidIds: [], reports: {} })
})

describe('useArchive', () => {
  it('keeps archive-only cryptids locked even if present in the store', () => {
    useAppStore.setState({ unlockedCryptidIds: ['cryptid-004', 'cryptid-005', 'cryptid-001'] })
    const { result } = renderHook(() => useArchive())
    const byId = Object.fromEntries(result.current.entries.map((e) => [e.cryptid.id, e]))
    expect(byId['cryptid-004'].unlocked).toBe(false)
    expect(byId['cryptid-004'].sealed).toBe(true)
    expect(byId['cryptid-005'].unlocked).toBe(false)
    expect(byId['cryptid-001'].unlocked).toBe(true)
    expect(result.current.discoveredCount).toBe(1)
  })

  it('reports counts and linked case', () => {
    const { result } = renderHook(() => useArchive())
    expect(result.current.entries).toHaveLength(5)
    expect(result.current.discoveredCount).toBe(0)
    expect(result.current.identifiableCount).toBe(3)
    expect(result.current.entries[0].linkedCaseId).toBe('case-001')
  })
})
