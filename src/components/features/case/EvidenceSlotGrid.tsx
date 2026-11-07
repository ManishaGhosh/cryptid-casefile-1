import { useState } from 'react'
import EvidenceSlot from './EvidenceSlot'
import EvidencePanel from './EvidencePanel'
import { useCaseProgress } from '@/hooks/useCaseProgress'
import { useEvidenceCollection } from '@/hooks/useEvidenceCollection'
import type { EvidenceItem } from '@/types/domain'

interface EvidenceSlotGridProps {
  caseId: string
}

export default function EvidenceSlotGrid({ caseId }: EvidenceSlotGridProps) {
  const { evidenceItems, isClosed } = useCaseProgress(caseId)
  const { isCollected, collect } = useEvidenceCollection(caseId)
  const [selected, setSelected] = useState<EvidenceItem | null>(null)

  if (evidenceItems.length === 0) {
    return <p className="type-body-sm text-off-white/60">No field evidence is on file for this case.</p>
  }

  const handleActivate = (item: EvidenceItem) => {
    if (isCollected(item.id)) {
      setSelected(item)
    } else {
      collect(item.id)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {evidenceItems.map((item) => (
          <EvidenceSlot
            key={item.id}
            evidence={item}
            collected={isCollected(item.id)}
            readOnly={isClosed}
            onActivate={handleActivate}
          />
        ))}
      </div>
      <EvidencePanel evidence={selected} onClose={() => setSelected(null)} readOnly={isClosed} />
    </>
  )
}
