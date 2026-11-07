import type { StateCreator } from 'zustand'
import type { EvidenceConnection } from '@/types/board'

export interface BoardSlice {
  nodePositions: Record<string, { x: number; y: number }>
  connections: Record<string, EvidenceConnection[]>
  updateNodePosition: (caseId: string, evidenceId: string, x: number, y: number) => void
  addConnection: (caseId: string, edge: EvidenceConnection) => void
  removeConnection: (caseId: string, edgeId: string) => void
  updateConnectionLabel: (caseId: string, edgeId: string, label: string) => void
  resetBoard: (caseId: string) => void
  resetAllBoards: () => void
}

export const createBoardSlice: StateCreator<BoardSlice, [], [], BoardSlice> = (set) => ({
  nodePositions: {},
  connections: {},
  updateNodePosition: (caseId, evidenceId, x, y) =>
    set((state) => ({
      nodePositions: { ...state.nodePositions, [`${caseId}:${evidenceId}`]: { x, y } },
    })),
  addConnection: (caseId, edge) =>
    set((state) => ({
      connections: {
        ...state.connections,
        [caseId]: [...(state.connections[caseId] ?? []), edge],
      },
    })),
  removeConnection: (caseId, edgeId) =>
    set((state) => ({
      connections: {
        ...state.connections,
        [caseId]: (state.connections[caseId] ?? []).filter((e) => e.id !== edgeId),
      },
    })),
  updateConnectionLabel: (caseId, edgeId, label) =>
    set((state) => ({
      connections: {
        ...state.connections,
        [caseId]: (state.connections[caseId] ?? []).map((e) =>
          e.id === edgeId ? { ...e, data: { ...e.data, label } } : e
        ),
      },
    })),
  resetBoard: (caseId) =>
    set((state) => {
      const newPositions = { ...state.nodePositions }
      const newConnections = { ...state.connections }
      Object.keys(newPositions).forEach((k) => {
        if (k.startsWith(`${caseId}:`)) delete newPositions[k]
      })
      delete newConnections[caseId]
      return { nodePositions: newPositions, connections: newConnections }
    }),
  resetAllBoards: () => set({ nodePositions: {}, connections: {} }),
})
