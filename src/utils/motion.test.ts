import { describe, expect, it } from 'vitest'
import type { Variant, Variants } from 'framer-motion'
import { DUR, EASE, fadeUp, pageVariants, stampDrop, staggerChildren } from './motion'

/** Reads `transition.duration` from a variant. */
function per(variant: Variants[string] | undefined): number {
  const t = (variant as { transition?: { duration?: number } } | undefined)?.transition
  return t?.duration ?? -1
}

function states(v: Variants): Variant[] {
  return Object.values(v).filter((s): s is Variant => typeof s !== 'function' && s !== undefined)
}

function hasMovement(variant: Variant): boolean {
  if (typeof variant === 'function') return false
  const r = variant as Record<string, unknown>
  return 'y' in r || 'x' in r || 'scale' in r
}

describe('motion presets', () => {
  it('exposes the agreed durations and easing', () => {
    expect(DUR).toEqual({ fast: 0.15, base: 0.3, slow: 0.7 })
    expect(EASE.out).toEqual([0.22, 1, 0.36, 1])
  })

  it.each([
    ['pageVariants', pageVariants(true)],
    ['fadeUp', fadeUp(true, 0.2)],
    ['staggerChildren', staggerChildren(true)],
    ['stampDrop', stampDrop(true, 0.2)],
  ])('%s has no y/x/scale movement when reduced', (_name, v) => {
    for (const s of states(v)) expect(hasMovement(s)).toBe(false)
  })

  it('reduced variants are fully opaque and instant', () => {
    for (const v of [pageVariants(true), fadeUp(true), stampDrop(true)]) {
      for (const s of states(v)) expect((s as { opacity?: number }).opacity).toBe(1)
    }
    expect(per(pageVariants(true).enter)).toBe(0)
  })

  it('non-reduced page variants rise 6px and settle at y 0 within 300-350ms', () => {
    const v = pageVariants(false)
    expect((v.initial as { y: number }).y).toBe(6)
    expect((v.enter as { y: number }).y).toBe(0)
    const d = per(v.enter)
    expect(d).toBeGreaterThanOrEqual(0.3)
    expect(d).toBeLessThanOrEqual(0.35)
  })

  it('non-reduced stampDrop starts scaled up and invisible', () => {
    const v = stampDrop(false)
    expect((v.hidden as { scale: number; opacity: number }).scale).toBe(1.4)
    expect((v.hidden as { opacity: number }).opacity).toBe(0)
  })
})
