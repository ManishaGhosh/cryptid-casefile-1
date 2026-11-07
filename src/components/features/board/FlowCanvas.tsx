import type { ReactNode } from 'react'
import { Background, BackgroundVariant, Controls, ReactFlow } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import EvidenceNode from './EvidenceNode'
import ConnectionEdge, { RED_STRING_STROKE } from './ConnectionEdge'
import { BoardContext } from './boardContext'
import { useBoardSync } from '@/hooks/useBoardSync'

// Defined at module level so React Flow does not remount nodes each render.
const nodeTypes = { evidence: EvidenceNode }
const edgeTypes = { investigator: ConnectionEdge }
const defaultEdgeOptions = { type: 'investigator' }
const connectionLineStyle = { stroke: RED_STRING_STROKE, strokeWidth: 2, strokeDasharray: '6 3' }

// Blueprint grid colours are raw because React Flow paints them into SVG patterns.
const GRID_FINE = 'rgba(184, 150, 12, 0.07)' // gold-dark @ 7%
const GRID_COARSE = 'rgba(184, 150, 12, 0.14)' // gold-dark @ 14%

interface FlowCanvasProps {
  caseId: string
  readOnly?: boolean
  children?: ReactNode
}

/** Investigation board canvas: dark cork/blueprint surface (see `.investigation-board` in index.css). */
export default function FlowCanvas({ caseId, readOnly = false, children }: FlowCanvasProps) {
  const { nodes, onNodesChange, edges, onConnect, onEdgesChange, isValidConnection } = useBoardSync(caseId)

  return (
    <div
      role="region"
      aria-label="Investigation board"
      className="investigation-board h-full w-full overflow-hidden rounded-sm border border-gold-dark/30"
    >
      <BoardContext.Provider value={{ caseId, readOnly }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        deleteKeyCode={readOnly ? null : ['Backspace', 'Delete']}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineStyle={connectionLineStyle}
        edgesFocusable={!readOnly}
        fitView
        minZoom={0.4}
        maxZoom={1.75}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        proOptions={{ hideAttribution: true }}
      >
        <Background id="grid-fine" variant={BackgroundVariant.Lines} gap={24} lineWidth={1} color={GRID_FINE} />
        <Background id="grid-coarse" variant={BackgroundVariant.Lines} gap={120} lineWidth={1} color={GRID_COARSE} />
        <Controls showInteractive={!readOnly} aria-label="Board controls" />
        {children}
      </ReactFlow>
      </BoardContext.Provider>
    </div>
  )
}
