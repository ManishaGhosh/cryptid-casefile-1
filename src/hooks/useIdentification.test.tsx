import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useIdentification } from './useIdentification'
import { useAppStore } from '@/store'

beforeEach(() => {
  useAppStore.setState({
    caseStatuses: { 'case-001': 'in-progress' },
    collectedEvidence: { 'case-001': ['EV-001', 'EV-002', 'EV-003'] },
    unlockedCryptidIds: [],
    lastIdentificationResult: null,
  })
})

describe('useIdentification', () => {
  it('cannot submit without a selection, then can', () => {
    const { result } = renderHook(() => useIdentification('case-001'))
    expect(result.current.canSubmit).toBe(false)
    act(() => result.current.setSelectedCryptidId('cryptid-001'))
    expect(result.current.canSubmit).toBe(true)
  })

  it('only returns results produced for its own case and clears on dismiss', () => {
    const { result } = renderHook(() => useIdentification('case-001'))
    act(() => result.current.setSelectedCryptidId('cryptid-001'))
    act(() => result.current.submit())
    expect(result.current.result?.outcome).toBe('success')
    const other = renderHook(() => useIdentification('case-002'))
    expect(other.result.current.result).toBeNull()
    act(() => result.current.dismiss())
    expect(useAppStore.getState().lastIdentificationResult).toBeNull()
  })

  it('blocks resubmission once identified', () => {
    const { result } = renderHook(() => useIdentification('case-001'))
    act(() => result.current.setSelectedCryptidId('cryptid-001'))
    act(() => result.current.submit())
    expect(result.current.canSubmit).toBe(false)
  })

  it('clears the stored result on unmount', () => {
    const { result, unmount } = renderHook(() => useIdentification('case-001'))
    act(() => result.current.setSelectedCryptidId('cryptid-001'))
    act(() => result.current.submit())
    expect(useAppStore.getState().lastIdentificationResult).not.toBeNull()
    unmount()
    expect(useAppStore.getState().lastIdentificationResult).toBeNull()
  })
})
