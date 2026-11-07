import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import EvidenceNode from './EvidenceNode'
import type { EvidenceNode as EvidenceNodeType } from '@/types/board'

function makeProps(extra: Record<string, unknown> = {}): NodeProps<EvidenceNodeType> {
  return {
    id: 'n1',
    type: 'evidence',
    data: {
      evidenceId: 'ev-001',
      evidenceName: 'Plaster Cast',
      evidenceCategory: 'physical',
      isSelected: false,
      ...extra,
    },
    selected: false,
    dragging: false,
    draggable: true,
    selectable: true,
    deletable: true,
    isConnectable: true,
    zIndex: 0,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
  }
}

function renderNode(extra?: Record<string, unknown>) {
  return render(
    <ReactFlowProvider>
      <EvidenceNode {...makeProps(extra)} />
    </ReactFlowProvider>,
  )
}

describe('EvidenceNode', () => {
  it('renders name, id and category', () => {
    renderNode()
    expect(screen.getByText('Plaster Cast')).toBeInTheDocument()
    expect(screen.getByText('ev-001')).toBeInTheDocument()
    expect(screen.getByText('physical')).toBeInTheDocument()
    expect(screen.getByLabelText('Evidence node: Plaster Cast')).toBeInTheDocument()
  })

  it('renders observation note when provided', () => {
    renderNode({ observationNote: 'Found near creek' })
    expect(screen.getByText('Found near creek')).toBeInTheDocument()
  })

  it('omits note when absent', () => {
    renderNode()
    expect(screen.queryByText('Found near creek')).not.toBeInTheDocument()
  })
})
