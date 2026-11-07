import { cn } from '@/utils/cn'
import type { CaseStatus } from '@/types/progress'

const CONFIG: Record<CaseStatus, { label: string; className: string }> = {
  'new': { label: 'NEW', className: 'bg-bureau-dark text-off-white/70 border-off-white/20' },
  'in-progress': { label: 'IN PROGRESS', className: 'bg-gold-dark/20 text-gold border-gold-dark/50' },
  'identified': { label: 'IDENTIFIED', className: 'bg-forest-dark/60 text-off-white/90 border-forest-light/60' },
  'closed': { label: 'CLOSED', className: 'bg-off-white/10 text-off-white/70 border-off-white/10 line-through' },
}

export default function StatusBadge({ status }: { status: CaseStatus }) {
  const { label, className } = CONFIG[status]
  return (
    <span className={cn('type-label inline-block rounded-sm border px-2 py-1', className)}>
      {label}
    </span>
  )
}
