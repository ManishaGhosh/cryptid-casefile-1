/**
 * StatusLight — small status indicator dot with an sr-only label.
 *
 * Use for: network/secure/online indicators, file status. Tones: green | gold | red | off.
 * `flicker` adds an irregular, slow (>= 3s cycle, never strobing) dim via the
 * `.status-flicker` CSS keyframe; it is disabled by prefers-reduced-motion in CSS and
 * also omitted when useReducedMotion() is true.
 */
import { useReducedMotion } from 'framer-motion'
import { cn } from '@/utils/cn'

export type StatusLightTone = 'green' | 'gold' | 'red' | 'off'

export interface StatusLightProps {
  tone: StatusLightTone
  flicker?: boolean
  label: string
  className?: string
  /** Set when the light sits on parchment, where the darker tones keep >= 3:1 contrast. */
  onPaper?: boolean
}

// Lighter green / red on dark surfaces so the dot stays >= 3:1 (WCAG 1.4.11).
const TONE: Record<StatusLightTone, string> = {
  green: 'bg-forest-text',
  gold: 'bg-gold',
  red: 'bg-blood-text',
  off: 'bg-off-white/20',
}
const PAPER_TONE: Record<StatusLightTone, string> = {
  green: 'bg-forest-light',
  gold: 'bg-gold-dark',
  red: 'bg-blood-light',
  off: 'bg-near-black/30',
}

export default function StatusLight({ tone, flicker = false, label, className, onPaper = false }: StatusLightProps) {
  const reduced = useReducedMotion() ?? false
  return (
    <span className={cn('inline-flex items-center', className)}>
      <span
        aria-hidden="true"
        data-testid="status-light"
        className={cn(
          'inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full',
          (onPaper ? PAPER_TONE : TONE)[tone],
          flicker && !reduced && 'status-flicker',
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}
