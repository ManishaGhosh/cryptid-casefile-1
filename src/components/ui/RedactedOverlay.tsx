import { cn } from '@/utils/cn'

interface RedactedOverlayProps {
  /** Text shown on the band. */
  label?: string
  className?: string
}

/** Hatched "sealed contents" band with a mono label. Purely decorative (aria-hidden). */
export default function RedactedOverlay({ label = 'REDACTED', className }: RedactedOverlayProps) {
  return (
    <div
      className={cn('sealed-band flex h-11 items-center justify-center', className)}
      aria-hidden="true"
      data-testid="sealed-band"
    >
      <span className="type-label text-off-white/70">{label}</span>
    </div>
  )
}
