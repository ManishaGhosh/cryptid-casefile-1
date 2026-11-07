import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '@/store'
import type { EvidenceConnection } from '@/types/board'

const edge = (id: string, source: string, target: string, label = ''): EvidenceConnection => ({
  id,
  source,
  target,
  data: { label },
})

beforeEach(() => {
  useAppStore.setState({ nodePositions: {}, connections: {} })
})

describe('boardSlice', () => {
  it('addConnection appends an edge under the case without touching other cases', () => {
    const s = useAppStore.getState()
    s.addConnection('case-001', edge('e1', 'EV-001', 'EV-002'))
    s.addConnection('case-002', edge('e2', 'EV-004', 'EV-005'))
    s.addConnection('case-001', edge('e3', 'EV-002', 'EV-003'))
    const { connections } = useAppStore.getState()
    expect(connections['case-001'].map((e) => e.id)).toEqual(['e1', 'e3'])
    expect(connections['case-002'].map((e) => e.id)).toEqual(['e2'])
  })

  it('removeConnection removes only the edge with that id', () => {
    const s = useAppStore.getState()
    s.addConnection('case-001', edge('e1', 'EV-001', 'EV-002'))
    s.addConnection('case-001', edge('e2', 'EV-002', 'EV-003'))
    useAppStore.getState().removeConnection('case-001', 'e1')
    expect(useAppStore.getState().connections['case-001'].map((e) => e.id)).toEqual(['e2'])
  })

  it('updateConnectionLabel changes only data.label of the matching edge', () => {
    const s = useAppStore.getState()
    s.addConnection('case-001', edge('e1', 'EV-001', 'EV-002', 'old'))
    s.addConnection('case-001', edge('e2', 'EV-002', 'EV-003', 'keep'))
    useAppStore.getState().updateConnectionLabel('case-001', 'e1', 'new')
    const [a, b] = useAppStore.getState().connections['case-001']
    expect(a).toEqual({ id: 'e1', source: 'EV-001', target: 'EV-002', data: { label: 'new' } })
    expect(b.data?.label).toBe('keep')
  })

  it('updateNodePosition stores under caseId:evidenceId', () => {
    useAppStore.getState().updateNodePosition('case-001', 'EV-001', 10, 20)
    expect(useAppStore.getState().nodePositions['case-001:EV-001']).toEqual({ x: 10, y: 20 })
  })

  it('resetBoard clears only the given case; resetAllBoards clears everything', () => {
    const s = useAppStore.getState()
    s.updateNodePosition('case-001', 'EV-001', 1, 1)
    s.updateNodePosition('case-002', 'EV-004', 2, 2)
    s.addConnection('case-001', edge('e1', 'EV-001', 'EV-002'))
    s.addConnection('case-002', edge('e2', 'EV-004', 'EV-005'))

    useAppStore.getState().resetBoard('case-001')
    let st = useAppStore.getState()
    expect(Object.keys(st.nodePositions)).toEqual(['case-002:EV-004'])
    expect(st.connections['case-001']).toBeUndefined()
    expect(st.connections['case-002']).toHaveLength(1)

    st.resetAllBoards()
    st = useAppStore.getState()
    expect(st.nodePositions).toEqual({})
    expect(st.connections).toEqual({})
  })
})
