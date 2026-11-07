/**
 * Panel — dark bureau panel (the standard container for sidebars, trays, forms).
 *
 * Optional mono header row: `eyebrow` (left) and `reference` (right, e.g. a form/file code) in
 * `.type-label`. Body padding is p-5. Heading elements stay with the caller so heading levels
 * remain correct on each page. `tone="alert"` switches to the blood-red treatment.
 */
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface PanelProps {
  children: ReactNode
  eyebrow?: string
  reference?: string
  tone?: 'default' | 'alert'
  as?: 'section' | 'div' | 'aside'
  'aria-label'?: string
  className?: string
  bodyClassName?: string
}

export default function Panel({
  children,
  eyebrow,
  reference,
  tone = 'default',
  as: Tag = 'section',
  'aria-label': ariaLabel,
  className,
  bodyClassName,
}: PanelProps) {
  const alert = tone === 'alert'
  return (
    <Tag
      aria-label={ariaLabel}
      className={cn(
        'texture-grain rounded-sm border',
        alert ? 'border-blood-dark/40 bg-blood-dark/10' : 'border-gold-dark/30 bg-bureau-dark',
        className,
      )}
    >
      {(eyebrow || reference) && (
        <div
          className={cn(
            'flex items-center justify-between gap-3 border-b px-5 py-2',
            alert ? 'border-blood-dark/30' : 'border-gold-dark/20',
          )}
        >
          {eyebrow && <span className={cn('type-label', alert && 'text-blood-text')}>{eyebrow}</span>}
          {reference && <span className="type-label text-gold/80">{reference}</span>}
        </div>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </Tag>
  )
}
