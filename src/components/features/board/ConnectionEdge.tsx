import { useContext, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'
import { Plus, X } from 'lucide-react'
import { BoardContext } from './boardContext'
import { useAppStore } from '@/store'
import { MAX_CONNECTION_LABEL } from '@/services/connectionRules'
import type { EvidenceConnection } from '@/types/board'

/**
 * Raw value for the SVG connection line (SVG strokes cannot use Tailwind classes). A touch
 * brighter than the `blood-light` token (#A52A2A, 2.7:1 on the board) so the string clears the
 * 3:1 non-text contrast bar (3.3:1 on bureau-black); see src/test/contrast.test.ts.
 */
export const RED_STRING_STROKE = '#B83232'

export default function ConnectionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<EvidenceConnection>) {
  const { caseId, readOnly } = useContext(BoardContext)
  const updateConnectionLabel = useAppStore((s) => s.updateConnectionLabel)
  const removeConnection = useAppStore((s) => s.removeConnection)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })
  const label = typeof data?.label === 'string' ? data.label : ''

  const startEdit = () => {
    setDraft(label)
    setEditing(true)
  }
  const commit = () => {
    if (!editing) return
    setEditing(false)
    updateConnectionLabel(caseId, id, draft.trim())
  }
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditing(false)
    }
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: RED_STRING_STROKE,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: '6 3',
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute flex items-center gap-1"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
        >
          {editing ? (
            <input
              autoFocus
              aria-label="Connection note"
              maxLength={MAX_CONNECTION_LABEL}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={onKeyDown}
              className="focus-ring-paper w-44 max-w-[60vw] rounded-sm border border-near-black/60 bg-parchment-light px-1.5 py-0.5 font-mono text-xs text-near-black"
            />
          ) : label ? (
            readOnly ? (
              <span className="rounded-sm bg-parchment-light px-1.5 py-0.5 font-mono text-xs text-near-black">
                {label}
              </span>
            ) : (
              <button
                type="button"
                onClick={startEdit}
                aria-label={`Edit connection note: ${label}`}
                className="focus-ring-paper rounded-sm bg-parchment-light px-1.5 py-0.5 font-mono text-xs text-near-black hover:bg-parchment [@media(pointer:coarse)]:px-3 [@media(pointer:coarse)]:py-2"
              >
                {label}
              </button>
            )
          ) : readOnly ? null : (
            <button
              type="button"
              onClick={startEdit}
              aria-label="Add connection note"
              className="type-meta focus-ring flex items-center gap-0.5 rounded-sm border border-gold-dark bg-bureau-dark px-1.5 py-0.5 text-gold-light hover:bg-bureau-black [@media(pointer:coarse)]:px-3 [@media(pointer:coarse)]:py-2"
            >
              <Plus size={10} aria-hidden="true" /> note
            </button>
          )}
          {!readOnly && !editing && (
            <button
              type="button"
              onClick={() => removeConnection(caseId, id)}
              aria-label="Remove connection"
              className="focus-ring rounded-full border border-blood-text bg-bureau-dark p-1 text-blood-text hover:bg-blood-dark hover:text-off-white [@media(pointer:coarse)]:p-2.5"
            >
              <X size={10} aria-hidden="true" />
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
