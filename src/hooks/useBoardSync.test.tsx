import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useBoardSync } from './useBoardSync'
import { useAppStore } from '@/store'

beforeEach(() => {
  useAppStore.setState({
    collectedEvidence: { 'case-001': ['EV-001', 'EV-002'] },
    observationNotes: {},
    nodePositions: {},
    connections: {},
  })
})

describe('useBoardSync', () => {
  it('builds initial nodes from collected evidence', () => {
    const { result } = renderHook(() => useBoardSync('case-001'))
    expect(result.current.nodes.map((n) => n.id)).toEqual(['EV-001', 'EV-002'])
    expect(result.current.edges).toEqual([])
  })

  it('persists position when a drag ends', () => {
    const { result } = renderHook(() => useBoardSync('case-001'))
    act(() => {
      result.current.onNodesChange([
        { type: 'position', id: 'EV-001', position: { x: 100, y: 120 }, dragging: false },
      ])
    })
    expect(useAppStore.getState().nodePositions['case-001:EV-001']).toEqual({ x: 100, y: 120 })
    expect(result.current.nodes[0].position).toEqual({ x: 100, y: 120 })
  })

  it('does not write to the store while dragging', () => {
    const { result } = renderHook(() => useBoardSync('case-001'))
    act(() => {
      result.current.onNodesChange([
        { type: 'position', id: 'EV-001', position: { x: 70, y: 80 }, dragging: true },
      ])
    })
    expect(useAppStore.getState().nodePositions).toEqual({})
    expect(result.current.nodes[0].position).toEqual({ x: 70, y: 80 })
  })

  it('adds a connection, rejects self-loops and reversed duplicates, and removes on change', () => {
    const { result } = renderHook(() => useBoardSync('case-001'))
    const conns = () => useAppStore.getState().connections['case-001'] ?? []
    act(() => {
      result.current.onConnect({ source: 'EV-001', target: 'EV-002', sourceHandle: null, targetHandle: null })
    })
    expect(conns()).toHaveLength(1)
    act(() => {
      result.current.onConnect({ source: 'EV-001', target: 'EV-001', sourceHandle: null, targetHandle: null })
      result.current.onConnect({ source: 'EV-002', target: 'EV-001', sourceHandle: null, targetHandle: null })
    })
    expect(conns()).toHaveLength(1)
    const id = conns()[0].id
    act(() => {
      result.current.onEdgesChange([{ type: 'remove', id }])
    })
    expect(conns()).toHaveLength(0)
  })

  it('adds a node when new evidence is collected', () => {
    const { result } = renderHook(() => useBoardSync('case-001'))
    act(() => {
      useAppStore.getState().collectEvidence('case-001', 'EV-003')
    })
    expect(result.current.nodes.map((n) => n.id)).toEqual(['EV-001', 'EV-002', 'EV-003'])
  })
})
