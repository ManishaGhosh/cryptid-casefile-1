import { useState } from 'react'
import { Lock, FileText } from 'lucide-react'
import EvidencePanel from '@/components/features/case/EvidencePanel'
import Panel from '@/components/ui/Panel'
import Button from '@/components/ui/Button'
import { useCaseProgress } from '@/hooks/useCaseProgress'
import { useEvidenceCollection } from '@/hooks/useEvidenceCollection'
import type { EvidenceItem } from '@/types/domain'

interface BoardEvidenceTrayProps {
  caseId: string
}

export default function BoardEvidenceTray({ caseId }: BoardEvidenceTrayProps) {
  const { evidenceItems, collectedCount, totalCount, isClosed } = useCaseProgress(caseId)
  const { isCollected, collect } = useEvidenceCollection(caseId)
  const [selected, setSelected] = useState<EvidenceItem | null>(null)

  return (
    <Panel aria-label="Evidence tray" eyebrow="EVIDENCE TRAY" reference={caseId.toUpperCase()} bodyClassName="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <h2 className="type-heading text-gold">Evidence Tray</h2>
        <span className="type-label">
          {collectedCount} / {totalCount} logged
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {evidenceItems.map((item) => {
          const collected = isCollected(item.id)
          return (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-sm border border-gold-dark/30 bg-bureau-black/40 p-3"
            >
              {collected ? (
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  aria-label={`Examine ${item.name}`}
                  className="type-body-sm focus-ring touch-target flex min-w-0 items-center gap-2 rounded-sm text-left text-off-white transition-colors hover:text-gold"
                >
                  <FileText size={16} aria-hidden="true" className="shrink-0 text-gold" />
                  <span className="truncate">{item.name}</span>
                </button>
              ) : (
                <>
                  <span className="type-body-sm flex min-w-0 items-center gap-2 text-off-white/60">
                    <Lock size={16} aria-hidden="true" className="shrink-0" />
                    <span className="truncate">Unlogged — {item.id}</span>
                  </span>
                  <Button
                    size="sm"
                    disabled={isClosed}
                    onClick={() => collect(item.id)}
                    aria-label={`Log ${item.id}`}
                    className="shrink-0"
                  >
                    Log
                  </Button>
                </>
              )}
            </li>
          )
        })}
      </ul>
      <EvidencePanel evidence={selected} onClose={() => setSelected(null)} readOnly={isClosed} />
    </Panel>
  )
}
