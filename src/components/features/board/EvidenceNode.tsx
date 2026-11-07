import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { StickyNote } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { EvidenceNode as EvidenceNodeType } from '@/types/board'

const HANDLE_CLASS = '!w-3 !h-3 !bg-gold-dark !border !border-near-black'

/** Pinned paper card: small desk shadow, red pin, mono exhibit number, category chip. */
function EvidenceNode({ data, selected }: NodeProps<EvidenceNodeType>) {
  const note =
    typeof data.observationNote === 'string' && data.observationNote.trim().length > 0
      ? data.observationNote
      : null

  return (
    <div
      aria-label={`Evidence node: ${data.evidenceName}`}
      className={cn(
        'texture-paper relative w-[220px] rounded-sm bg-parchment-light text-near-black',
        'border border-parchment-dark px-3 pb-3 pt-5 shadow-paper',
        selected && 'ring-2 ring-gold',
      )}
    >
      {/* Red pin: head with a small cast shadow */}
      <span
        aria-hidden="true"
        className="absolute -top-1.5 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full border border-blood-dark bg-blood-light shadow-paper"
      />
      <Handle type="target" position={Position.Top} id="t" className={HANDLE_CLASS} />
      <Handle type="source" position={Position.Bottom} id="b" className={HANDLE_CLASS} />
      <Handle type="target" position={Position.Left} id="l" className={HANDLE_CLASS} />
      <Handle type="source" position={Position.Right} id="r" className={HANDLE_CLASS} />

      <p className="type-label text-near-black/70">{data.evidenceId}</p>
      {/* Not a heading: nodes sit before the page's h2 sections in the DOM, so an h3 here would skip a level. */}
      <p className="mt-1 break-words font-serif text-step-heading font-bold leading-snug">{data.evidenceName}</p>
      <span className="type-label mt-2 inline-block rounded-sm bg-forest-dark px-2 py-0.5 text-off-white">
        {data.evidenceCategory}
      </span>
      {note && (
        <p className="type-body-sm mt-2 flex items-start gap-1 text-near-black/80">
          <StickyNote size={12} aria-hidden="true" className="mt-1 shrink-0" />
          <span className="truncate">{note}</span>
        </p>
      )}
    </div>
  )
}

export default memo(EvidenceNode)
