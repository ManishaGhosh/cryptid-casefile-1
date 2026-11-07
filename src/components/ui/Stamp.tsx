/**
 * Stamp — classified rubber stamp (double border, mono caps, uneven ink via SVG-noise mask).
 *
 * Use for: CLASSIFIED / CASE CLOSED / LOGGED style marks laid over documents.
 * Decorative by default (`aria-hidden`); pass `label` to expose an sr-only equivalent.
 * `animate` plays the stampDrop impact (skipped under reduced motion).
 * Position it yourself via `className` (e.g. `absolute top-5 right-5`).
 */
import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/utils/cn'
import { stampDrop } from '@/utils/motion'

export type StampTone = 'red' | 'gold' | 'green' | 'ink'
export type StampSize = 'sm' | 'md' | 'lg'

export interface StampProps {
  children: ReactNode
  tone: StampTone
  rotate?: number
  size?: StampSize
  /** Background the stamp sits on; picks an ink colour with enough contrast. Default `paper`. */
  surface?: StampSurface
  animate?: boolean
  /** Screen-reader text. When omitted the stamp is hidden from assistive tech. */
  label?: string
  className?: string
}

/** Surface the stamp is printed on. `paper` (default) is parchment; `dark` is bureau-black/dark. */
export type StampSurface = 'paper' | 'dark'

const TONE: Record<StampSurface, Record<StampTone, string>> = {
  paper: {
    red: 'text-blood-light border-blood-light',
    gold: 'text-gold-dark border-gold-dark',
    green: 'text-forest border-forest',
    ink: 'text-near-black border-near-black',
  },
  // Lighter red / green inks keep the stamp text >= 4.5:1 on dark surfaces.
  dark: {
    red: 'text-blood-text border-blood-text',
    gold: 'text-gold-dark border-gold-dark',
    green: 'text-forest-text border-forest-text',
    ink: 'text-off-white border-off-white',
  },
}

const SIZE: Record<StampSize, string> = {
  sm: 'text-[11px] px-2 py-0.5',
  md: 'text-xs sm:text-sm px-3 py-1',
  lg: 'text-xl md:text-2xl px-3 py-1',
}

export default function Stamp({
  children,
  tone,
  rotate = -6,
  size = 'md',
  surface = 'paper',
  animate = false,
  label,
  className,
}: StampProps) {
  const reduced = useReducedMotion() ?? false
  const classes = cn(
    'stamp-ink inline-block select-none rounded-sm border-2 font-mono font-bold uppercase tracking-widest',
    TONE[surface][tone],
    SIZE[size],
    className,
  )

  return (
    <>
      {label && <span className="sr-only">{label}</span>}
      <motion.div
        aria-hidden="true"
        data-testid="stamp"
        className={classes}
        style={{ rotate }}
        variants={stampDrop(reduced, 0, rotate)}
        initial={animate ? 'hidden' : false}
        animate="show"
      >
        <span className="stamp-ink-inner block rounded-[1px] border border-current px-1">{children}</span>
      </motion.div>
    </>
  )
}
