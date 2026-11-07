import { MiniMap } from '@xyflow/react'

/** Must be rendered as a child of FlowCanvas (inside <ReactFlow>). */
export default function BoardMinimap() {
  return (
    <MiniMap
      ariaLabel="Board overview"
      pannable
      zoomable
      maskColor="rgba(13, 13, 13, 0.75)" // bureau-black @ 75%
      nodeColor="#E8D5A3" // parchment-dark
      nodeStrokeColor="#B8960C" // gold-dark
      className="!rounded-sm !border !border-gold-dark/40 !bg-bureau-dark max-sm:!hidden"
    />
  )
}
