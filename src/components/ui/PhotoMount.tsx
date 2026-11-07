import { Camera } from 'lucide-react'

interface PhotoMountProps {
  /** Mono caption, e.g. "FIELD PHOTOGRAPH - NOT ON FILE". */
  label: string
  /** Reference line, e.g. "REF CASE-001". */
  reference: string
}

/**
 * Finished-looking stand-in for a photograph that has not been added yet: a dark inset with
 * a gold corner frame and a typed caption. Fills its parent (BureauImage supplies the aspect ratio).
 */
export default function PhotoMount({ label, reference }: PhotoMountProps) {
  return (
    <div className="texture-grain relative flex h-full w-full flex-col items-center justify-center gap-1 overflow-hidden bg-bureau-black px-3 text-center shadow-[inset_0_0_24px_rgba(0,0,0,0.7)]">
      <span aria-hidden="true" className="absolute inset-2 border border-gold-dark/30" />
      <Camera className="h-4 w-4 text-gold/70" aria-hidden="true" />
      <span className="type-label relative break-words text-off-white/70">{label}</span>
      <span className="type-label relative break-words text-gold/80">{reference}</span>
    </div>
  )
}
