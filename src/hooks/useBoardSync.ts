import { useCallback, useEffect, useMemo, useState } from 'react'
import { applyEdgeChanges, applyNodeChanges } from '@xyflow/react'
import type { Connection, EdgeChange, NodeChange } from '@xyflow/react'
import { useAppStore } from '@/store'
import { EVIDENCE } from '@/data/evidence'
import { buildNodes } from '@/services/boardLayout'
import { canConnect, makeConnection } from '@/services/connectionRules'
import type { EvidenceConnection, EvidenceNode } from '@/types/board'

const STABLE_EMPTY_IDS: string[] = []
const STABLE_EMPTY_EDGES: EvidenceConnection[] = []
const STABLE_EMPTY_NOTES: Record<string, string> = {}

export interface BoardSync {
  nodes: EvidenceNode[]
  onNodesChange: (changes: NodeChange<EvidenceNode>[]) => void
  edges: EvidenceConnection[]
  onConnect: (connection: Connection) => void
  onEdgesChange: (changes: EdgeChange<EvidenceConnection>[]) => void
  isValidConnection: (connection: Connection | EvidenceConnection) => boolean
}

/**
 * Syncs store state (collected evidence, notes, persisted positions) with
 * React Flow's local node state. Store writes happen only when a drag ends.
 */
export function useBoardSync(caseId: string): BoardSync {
  const collectedIds = useAppStore((s) => s.collectedEvidence[caseId]) ?? STABLE_EMPTY_IDS
  const notes = useAppStore((s) => s.observationNotes) ?? STABLE_EMPTY_NOTES
  const storedEdges = useAppStore((s) => s.connections[caseId]) ?? STABLE_EMPTY_EDGES
  const addConnection = useAppStore((s) => s.addConnection)
  const removeConnection = useAppStore((s) => s.removeConnection)
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([])
  const edges = useMemo(
    () => storedEdges.map((e) => ({ ...e, selected: selectedEdgeIds.includes(e.id) })),
    [storedEdges, selectedEdgeIds],
  )
  const updateNodePosition = useAppStore((s) => s.updateNodePosition)

  const [nodes, setNodes] = useState<EvidenceNode[]>(() =>
    buildNodes(collectedIds, EVIDENCE, useAppStore.getState().nodePositions, caseId, notes),
  )

  // Re-derive when collected ids / notes / case change, keeping local positions.
  useEffect(() => {
    const fresh = buildNodes(
      collectedIds,
      EVIDENCE,
      useAppStore.getState().nodePositions,
      caseId,
      notes,
    )
    setNodes((prev) => {
      const prevById = new Map(prev.map((n) => [n.id, n]))
      return fresh.map((n) => {
        const existing = prevById.get(n.id)
        return existing
          ? { ...existing, data: n.data }
          : n
      })
    })
  }, [collectedIds, notes, caseId])

  const onNodesChange = useCallback(
    (changes: NodeChange<EvidenceNode>[]) => {
      setNodes((prev) => applyNodeChanges<EvidenceNode>(changes, prev))
      for (const change of changes) {
        if (change.type === 'position' && change.dragging === false && change.position) {
          updateNodePosition(caseId, change.id, change.position.x, change.position.y)
        }
      }
    },
    [caseId, updateNodePosition],
  )

  const isValidConnection = useCallback(
    (c: Connection | EvidenceConnection) =>
      canConnect(c.source, c.target, useAppStore.getState().connections[caseId] ?? []),
    [caseId],
  )

  const onConnect = useCallback(
    (c: Connection) => {
      const existing = useAppStore.getState().connections[caseId] ?? []
      if (!canConnect(c.source, c.target, existing)) return
      addConnection(caseId, makeConnection(c.source, c.target, c.sourceHandle, c.targetHandle))
    },
    [caseId, addConnection],
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange<EvidenceConnection>[]) => {
      const next = applyEdgeChanges<EvidenceConnection>(changes, edges)
      setSelectedEdgeIds(next.filter((e) => e.selected).map((e) => e.id))
      for (const change of changes) {
        if (change.type === 'remove') removeConnection(caseId, change.id)
      }
    },
    [caseId, edges, removeConnection],
  )

  return { nodes, onNodesChange, edges, onConnect, onEdgesChange, isValidConnection }
}
