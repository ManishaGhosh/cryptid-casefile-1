import type { EvidenceNode } from '@/types/board'
import type { EvidenceItem } from '@/types/domain'

const COLUMNS = 2
const H_GAP = 280
const V_GAP = 200
const ORIGIN_X = 40
const ORIGIN_Y = 40

/** Default grid position for the node at `index` (2 columns). */
export function defaultGridPosition(index: number): { x: number; y: number } {
  return {
    x: ORIGIN_X + (index % COLUMNS) * H_GAP,
    y: ORIGIN_Y + Math.floor(index / COLUMNS) * V_GAP,
  }
}

/**
 * Builds React Flow evidence nodes from collected ids.
 * Ids without a seed item are skipped. Persisted positions
 * (keyed `${caseId}:${evidenceId}`) win over the grid default.
 */
export function buildNodes(
  collectedIds: readonly string[],
  evidenceItems: readonly EvidenceItem[],
  nodePositions: Readonly<Record<string, { x: number; y: number }>>,
  caseId: string,
  observationNotes: Readonly<Record<string, string>>,
): EvidenceNode[] {
  const nodes: EvidenceNode[] = []
  collectedIds.forEach((id, index) => {
    const item = evidenceItems.find((e) => e.id === id)
    if (!item) return
    const position = nodePositions[`${caseId}:${id}`] ?? defaultGridPosition(index)
    nodes.push({
      id,
      type: 'evidence',
      position: { x: position.x, y: position.y },
      data: {
        evidenceId: item.id,
        evidenceName: item.name,
        evidenceCategory: item.category,
        isSelected: false,
        observationNote: observationNotes[id],
      },
    })
  })
  return nodes
}
