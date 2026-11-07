/**
 * Motion presets (shared foundation).
 *
 * Usage: `const reduced = useReducedMotion() ?? false` then pass `reduced` to a factory.
 * Every factory returns instant variants (no movement, zero duration) when `reduced` is true,
 * so the final state renders synchronously. Hover lifts elsewhere: <= 2px translate and a
 * border colour change, never scale > 1.02.
 */
import type { Transition, Variants } from 'framer-motion'

export const DUR = { fast: 0.15, base: 0.3, slow: 0.7 } as const

export const EASE = { out: [0.22, 1, 0.36, 1] } as const satisfies Record<string, readonly [number, number, number, number]>

const INSTANT: Transition = { duration: 0 }

function tween(duration: number, delay = 0): Transition {
  return { duration, delay, ease: [...EASE.out] }
}

/** Route transition: fade + 6px rise. Exit is a quick fade. Ends at `y: 0` (no lingering transform). */
export function pageVariants(reduced: boolean): Variants {
  if (reduced) {
    return {
      initial: { opacity: 1 },
      enter: { opacity: 1, transition: INSTANT },
      exit: { opacity: 1, transition: INSTANT },
    }
  }
  return {
    initial: { opacity: 0, y: 6 },
    enter: { opacity: 1, y: 0, transition: tween(0.32) },
    exit: { opacity: 0, transition: tween(DUR.fast) },
  }
}

/** Generic fade + rise for blocks. Variant names: `hidden` / `show`. */
export function fadeUp(reduced: boolean, delay = 0): Variants {
  if (reduced) {
    return { hidden: { opacity: 1 }, show: { opacity: 1, transition: INSTANT } }
  }
  return {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: tween(DUR.base, delay) },
  }
}

/** Parent container that staggers `fadeUp` children. Variant names: `hidden` / `show`. */
export function staggerChildren(reduced: boolean, stagger = 0.06): Variants {
  if (reduced) {
    return { hidden: { opacity: 1 }, show: { opacity: 1, transition: INSTANT } }
  }
  return {
    hidden: { opacity: 1 },
    show: { opacity: 1, transition: { staggerChildren: stagger } },
  }
}

/** Rubber-stamp impact: scale 1.4 -> 1, opacity 0 -> 1, slight rotation settle (~250ms). */
export function stampDrop(reduced: boolean, delay = 0, rotate = 0): Variants {
  if (reduced) {
    return { hidden: { opacity: 1, rotate }, show: { opacity: 1, rotate, transition: INSTANT } }
  }
  return {
    hidden: { opacity: 0, scale: 1.4, rotate: rotate - 4 },
    show: { opacity: 1, scale: 1, rotate, transition: tween(0.25, delay) },
  }
}
