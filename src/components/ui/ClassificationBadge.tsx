import { cn } from '@/utils/cn'
import type { ClassificationLevel } from '@/types/domain'
import type { StampTone } from '@/components/ui/Stamp'

const CONFIG: Record<ClassificationLevel, { label: string; className: string; stamp: StampTone }> = {
  'LEVEL 1 — UNCLASSIFIED': { label: 'UNCLASSIFIED', className: 'text-off-white/80 border-forest-light/60', stamp: 'green' },
  'LEVEL 2 — RESTRICTED': { label: 'RESTRICTED', className: 'text-off-white/70 border-off-white/30', stamp: 'gold' },
  'LEVEL 3 — RESTRICTED': { label: 'RESTRICTED', className: 'text-gold/80 border-gold-dark/60', stamp: 'gold' },
  'LEVEL 4 — CONFIDENTIAL': { label: 'CONFIDENTIAL', className: 'text-gold-light border-gold', stamp: 'red' },
  'LEVEL 5 — EYES ONLY': { label: 'EYES ONLY', className: 'text-blood-text border-blood-dark', stamp: 'red' },
}

/** Short classification wording used by both the badge and the rotated Stamp. */
export function classificationLabel(level: ClassificationLevel): string {
  return CONFIG[level].label
}

/** Stamp ink colour that matches the classification level. */
export function classificationStampTone(level: ClassificationLevel): StampTone {
  return CONFIG[level].stamp
}

export default function ClassificationBadge({ level }: { level: ClassificationLevel }) {
  const { label, className } = CONFIG[level]
  return (
    <span className={cn('type-label inline-block rounded-sm border px-1.5 py-0.5', className)}>
      {label}
    </span>
  )
}
