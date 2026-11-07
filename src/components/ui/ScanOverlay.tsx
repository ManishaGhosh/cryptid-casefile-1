/**
 * ScanOverlay — one-shot scanning sweep over its parent.
 *
 * Use for: evidence scanning / document analysis. The parent must be `position: relative`
 * (or otherwise a containing block). A thin gold-dark line with a soft, low-opacity falloff
 * sweeps top -> bottom once, then `onDone` fires. Under reduced motion nothing renders and
 * `onDone` is called immediately. Never intercepts pointer events.
 */
import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { EASE } from '@/utils/motion'

export interface ScanOverlayProps {
  active: boolean
  durationMs?: number
  onDone?: () => void
}

export default function ScanOverlay({ active, durationMs = 350, onDone }: ScanOverlayProps) {
  const reduced = useReducedMotion() ?? false
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    if (active && reduced) doneRef.current?.()
  }, [active, reduced])

  if (!active || reduced) return null

  return (
    <div
      aria-hidden="true"
      data-testid="scan-overlay"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <motion.div
        className="scan-line absolute inset-x-0"
        initial={{ top: '0%' }}
        animate={{ top: '100%' }}
        transition={{ duration: durationMs / 1000, ease: [...EASE.out] }}
        onAnimationComplete={() => doneRef.current?.()}
      />
    </div>
  )
}
