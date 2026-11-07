import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Lock } from 'lucide-react'
import EvidenceCard from './EvidenceCard'
import ScanOverlay from '@/components/ui/ScanOverlay'
import Stamp from '@/components/ui/Stamp'
import { cn } from '@/utils/cn'
import { EASE } from '@/utils/motion'
import type { EvidenceItem } from '@/types/domain'

interface EvidenceSlotProps {
  evidence: EvidenceItem
  collected: boolean
  readOnly?: boolean
  onActivate: (evidence: EvidenceItem) => void
}

/**
 * Reveal sequence (locked -> collected), purely visual; the store is updated on the first click:
 *   scan    350ms  ScanOverlay sweeps the locked card
 *   wipe    100ms hold + 200ms wipe: band label swaps to "DECLASSIFYING…", then the band wipes left -> right
 *   settle  150ms  parchment card fades in + 4px rise, "LOGGED" stamp drops in (total ~800ms)
 * Reduced motion: instant swap, no scan.
 */
type Phase = 'scan' | 'wipe' | 'settle'

const SCAN_MS = 350
const WIPE_HOLD_SECONDS = 0.1
const WIPE_SECONDS = 0.2
const SETTLE_SECONDS = 0.15
export default function EvidenceSlot({ evidence, collected, readOnly = false, onActivate }: EvidenceSlotProps) {
  const reduced = useReducedMotion() ?? false
  // True when the slot was mounted locked, so a later collection plays the reveal.
  const mountedLocked = useRef(!collected)
  const [phase, setPhase] = useState<Phase>('scan')

  const animate = mountedLocked.current && collected && !reduced
  const showLockedFace = !collected || (animate && phase !== 'settle')
  const disabled = !collected && readOnly

  const label = collected
    ? `Examine evidence: ${evidence.name}`
    : readOnly
      ? `Locked evidence: ${evidence.name}`
      : `Collect evidence: ${evidence.name}`

  const wiping = animate && phase === 'wipe'

  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (disabled) return
        onActivate(evidence)
      }}
      className={cn(
        'focus-ring relative block w-full overflow-hidden rounded-sm text-left transition-colors',
        showLockedFace
          ? 'texture-grain border border-dashed border-gold-dark/30 bg-bureau-dark'
          : 'shadow-paper transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        showLockedFace && !disabled && 'hover:border-gold-dark/60',
      )}
    >
      {showLockedFace ? (
        <div className="p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="type-label">SEALED · {evidence.category}</span>
            <Lock className="w-4 h-4 text-gold/70" aria-hidden="true" />
          </div>
          <h3 className="type-heading mb-3 text-off-white">{evidence.name}</h3>
          <div className="mb-3 h-11" aria-hidden="true">
            <motion.div
              data-testid="sealed-band"
              className="sealed-band flex h-full items-center justify-center"
              initial={false}
              animate={{ clipPath: wiping ? 'inset(0 0 0 100%)' : 'inset(0 0 0 0%)' }}
              transition={{ duration: WIPE_SECONDS, delay: wiping ? WIPE_HOLD_SECONDS : 0, ease: [...EASE.out] }}
              onAnimationComplete={() => {
                if (wiping) setPhase('settle')
              }}
            >
              <span className="type-label text-off-white/70">{wiping ? 'DECLASSIFYING…' : 'CONTENTS CLASSIFIED'}</span>
            </motion.div>
          </div>
          <span className="type-label text-gold/80">
            {collected ? 'LOGGING…' : readOnly ? 'NOT LOGGED' : 'CLICK TO LOG EVIDENCE'}
          </span>
        </div>
      ) : (
        <motion.div
          initial={animate ? { opacity: 0, y: 4 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: SETTLE_SECONDS, ease: [...EASE.out] }}
        >
          <EvidenceCard evidence={evidence} />
          {animate && <Stamp tone="green" size="sm" rotate={-8} animate className="absolute right-2 top-2">LOGGED</Stamp>}
        </motion.div>
      )}

      <ScanOverlay
        active={animate && phase === 'scan'}
        durationMs={SCAN_MS}
        onDone={() => setPhase('wipe')}
      />
    </button>
  )
}
