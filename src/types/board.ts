import type { Node, Edge } from '@xyflow/react'

export interface EvidenceNodeData {
  evidenceId: string
  evidenceName: string
  evidenceCategory: string
  isSelected: boolean
  [key: string]: unknown
}

export type EvidenceNode = Node<EvidenceNodeData, 'evidence'>

export interface EvidenceConnectionData {
  /** Optional investigator note, max 80 characters */
  label: string
  [key: string]: unknown
}

export type EvidenceConnection = Edge<EvidenceConnectionData>
