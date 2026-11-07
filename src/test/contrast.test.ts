/**
 * WCAG 2.1 AA colour-contrast guard.
 *
 * Colours come from tailwind.config.ts (the single source of truth for tokens). Text that uses an
 * opacity (e.g. `text-off-white/70`) is composited over the surface it is printed on before the
 * ratio is computed, exactly as a browser would paint it.
 *
 *   - Text: 4.5:1 (the large ConfidenceMeter numeral only needs 3:1 but is held to 4.5:1 too).
 *   - Non-text (focus rings, meter segments, status dots, connection strings, form borders): 3:1.
 *
 * When this fails, fix the component (raise the opacity or switch token) rather than the test.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import tailwindConfig from '../../tailwind.config'
import { RED_STRING_STROKE } from '@/components/features/board/ConnectionEdge'

type Rgb = readonly [number, number, number]

const COLORS: Record<string, string> = tailwindConfig.theme.extend.colors

const TEXT_MIN = 4.5
const NON_TEXT_MIN = 3

function hexToRgb(hex: string): Rgb {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  if (!m) throw new Error(`Not a #RRGGBB colour: ${hex}`)
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
}

function token(name: string): Rgb {
  const hex = COLORS[name]
  if (!hex) throw new Error(`Unknown colour token: ${name}`)
  return hexToRgb(hex)
}

/** `fg` at `alpha` painted over an opaque `bg`. */
function composite(fg: Rgb, alpha: number, bg: Rgb): Rgb {
  return [
    fg[0] * alpha + bg[0] * (1 - alpha),
    fg[1] * alpha + bg[1] * (1 - alpha),
    fg[2] * alpha + bg[2] * (1 - alpha),
  ]
}

function channel(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

function luminance(rgb: Rgb): number {
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2])
}

function contrast(a: Rgb, b: Rgb): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

interface Surface {
  name: string
  rgb: Rgb
}

/** A named surface built by stacking tinted layers (e.g. `bg-forest-dark/20`) on a base token. */
function surface(base: string, ...layers: Array<readonly [string, number]>): Surface {
  let rgb = token(base)
  const parts = [base]
  for (const [layer, alpha] of layers) {
    rgb = composite(token(layer), alpha, rgb)
    parts.push(`${layer}/${Math.round(alpha * 100)}`)
  }
  return { name: parts.join(' + '), rgb }
}

// ── Dark surfaces actually used in the UI ───────────────────────────────────────────────────
const BLACK = surface('bureau-black')
const DARK = surface('bureau-dark')
const DARK_GOLD_10 = surface('bureau-dark', ['gold-dark', 0.1]) // active stat card, active nav link
const DARK_GOLD_20 = surface('bureau-dark', ['gold-dark', 0.2]) // "in progress" badge
const DARK_FOREST_20 = surface('bureau-dark', ['forest-dark', 0.2]) // unlocked archive row
const DARK_FOREST_30 = surface('bureau-dark', ['forest-dark', 0.3]) // identified block
const DARK_FOREST_60 = surface('bureau-dark', ['forest-dark', 0.6]) // "identified" badge
const DARK_BLOOD_10 = surface('bureau-dark', ['blood-dark', 0.1]) // alert panel / banner
const DARK_BLOOD_30 = surface('bureau-dark', ['blood-dark', 0.3]) // danger button hover
const DARK_OFF_10 = surface('bureau-dark', ['off-white', 0.1]) // "closed" badge
// ── Parchment surfaces ──────────────────────────────────────────────────────────────────────
const PAPER_LIGHT = surface('parchment-light')
const PAPER = surface('parchment')
const PAPER_DARK = surface('parchment-dark')

interface TextCase {
  label: string
  fg: string
  alpha: number
  on: Surface[]
}

/** `.type-label` colour comes from index.css, so changing it there is checked here too. */
function typeLabelAlpha(): number {
  const css = readFileSync(join(process.cwd(), 'src', 'index.css'), 'utf8')
  const m = /\.type-label\s*\{[^}]*text-off-white\/(\d+)/.exec(css)
  if (!m) throw new Error('Could not find the default .type-label colour in index.css')
  return parseInt(m[1], 10) / 100
}

const TEXT_ON_DARK: TextCase[] = [
  { label: '.type-label default', fg: 'off-white', alpha: typeLabelAlpha(), on: [BLACK, DARK, DARK_GOLD_10, DARK_FOREST_20, DARK_BLOOD_10] },
  { label: 'text-off-white/70', fg: 'off-white', alpha: 0.7, on: [BLACK, DARK, DARK_BLOOD_10, DARK_FOREST_20, DARK_OFF_10] },
  { label: 'text-off-white/80', fg: 'off-white', alpha: 0.8, on: [BLACK, DARK, DARK_FOREST_30] },
  { label: 'text-off-white/90', fg: 'off-white', alpha: 0.9, on: [BLACK, DARK, DARK_GOLD_10, DARK_FOREST_60] },
  { label: 'text-off-white', fg: 'off-white', alpha: 1, on: [BLACK, DARK, DARK_BLOOD_10, DARK_FOREST_60] },
  { label: 'text-gold/80', fg: 'gold', alpha: 0.8, on: [BLACK, DARK, DARK_GOLD_10] },
  { label: 'text-gold', fg: 'gold', alpha: 1, on: [BLACK, DARK, DARK_GOLD_10, DARK_GOLD_20] },
  { label: 'text-gold-light', fg: 'gold-light', alpha: 1, on: [BLACK, DARK] },
  { label: 'text-gold-dark (stamps, cover label)', fg: 'gold-dark', alpha: 1, on: [BLACK, DARK] },
  { label: 'text-forest-text', fg: 'forest-text', alpha: 1, on: [BLACK, DARK, DARK_FOREST_30] },
  { label: 'text-blood-text', fg: 'blood-text', alpha: 1, on: [BLACK, DARK, DARK_BLOOD_10, DARK_BLOOD_30] },
]

const TEXT_ON_PAPER: TextCase[] = [
  { label: 'text-near-black/70', fg: 'near-black', alpha: 0.7, on: [PAPER_LIGHT, PAPER] },
  { label: 'text-near-black/80', fg: 'near-black', alpha: 0.8, on: [PAPER_LIGHT, PAPER] },
  { label: 'text-near-black/90', fg: 'near-black', alpha: 0.9, on: [PAPER_LIGHT, PAPER] },
  { label: 'text-near-black', fg: 'near-black', alpha: 1, on: [PAPER_LIGHT, PAPER, PAPER_DARK] },
  { label: 'text-blood-dark', fg: 'blood-dark', alpha: 1, on: [PAPER_LIGHT, PAPER] },
  { label: 'text-forest-dark', fg: 'forest-dark', alpha: 1, on: [PAPER_LIGHT, PAPER] },
  { label: 'text-blood-light (paper stamps)', fg: 'blood-light', alpha: 1, on: [PAPER_LIGHT] },
  { label: 'text-forest (paper stamps)', fg: 'forest', alpha: 1, on: [PAPER_LIGHT, PAPER] },
]

function ratioFor(c: TextCase, s: Surface): number {
  return contrast(composite(token(c.fg), c.alpha, s.rgb), s.rgb)
}

describe('text contrast (WCAG 2.1 AA, 4.5:1)', () => {
  const cases = [...TEXT_ON_DARK, ...TEXT_ON_PAPER].flatMap((c) =>
    c.on.map((s) => {
      const ratio = ratioFor(c, s)
      return { name: `${c.label} on ${s.name}`, ratio, shown: ratio.toFixed(2) }
    }),
  )

  it.each(cases)('$name >= 4.5 (got $shown)', ({ ratio }) => {
    expect(ratio).toBeGreaterThanOrEqual(TEXT_MIN)
  })

  it('.type-label default is off-white at 60% or stronger', () => {
    expect(typeLabelAlpha()).toBeGreaterThanOrEqual(0.6)
  })

  it('light text on solid chips and buttons', () => {
    const pairs: Array<[string, string, string]> = [
      ['off-white', 'forest-dark', 'ON FILE / category chips'],
      ['off-white', 'blood-dark', 'LOCKED chip'],
      ['near-black', 'gold', 'primary button'],
      ['off-white', 'blood', 'purge confirm button'],
    ]
    for (const [fg, bg, what] of pairs) {
      const ratio = contrast(token(fg), token(bg))
      expect(ratio, what).toBeGreaterThanOrEqual(TEXT_MIN)
    }
  })

  it('closed HQ case cards stay readable at their group opacity (90%)', () => {
    const page = BLACK
    const card = surface('bureau-black', ['bureau-dark', 0.6])
    const groupOpacity = 0.9
    for (const alpha of [typeLabelAlpha(), 0.7]) {
      const text = composite(composite(token('off-white'), alpha, card.rgb), groupOpacity, page.rgb)
      const bg = composite(card.rgb, groupOpacity, page.rgb)
      expect(contrast(text, bg)).toBeGreaterThanOrEqual(TEXT_MIN)
    }
  })
})

describe('non-text contrast (WCAG 1.4.11, 3:1)', () => {
  it('focus rings: gold on dark surfaces, forest-dark on parchment', () => {
    const css = readFileSync(join(process.cwd(), 'src', 'index.css'), 'utf8')
    expect(css).toMatch(/\.focus-ring\s*\{[^}]*ring-gold\b/)
    expect(css).toMatch(/\.focus-ring-paper\s*\{[^}]*ring-forest-dark\b/)
    for (const s of [BLACK, DARK]) {
      expect(contrast(token('gold'), s.rgb), s.name).toBeGreaterThanOrEqual(NON_TEXT_MIN)
    }
    for (const s of [PAPER_LIGHT, PAPER]) {
      expect(contrast(token('forest-dark'), s.rgb), s.name).toBeGreaterThanOrEqual(NON_TEXT_MIN)
    }
  })

  it('confidence meter segments and status dots on dark surfaces', () => {
    for (const fg of ['forest-text', 'gold', 'blood-text']) {
      for (const s of [BLACK, DARK]) {
        expect(contrast(token(fg), s.rgb), `${fg} on ${s.name}`).toBeGreaterThanOrEqual(NON_TEXT_MIN)
      }
    }
  })

  it('status dots on parchment (report footer)', () => {
    expect(contrast(token('forest-light'), PAPER_LIGHT.rgb)).toBeGreaterThanOrEqual(NON_TEXT_MIN)
  })

  it('the red connection string on the board background', () => {
    expect(contrast(hexToRgb(RED_STRING_STROKE), BLACK.rgb)).toBeGreaterThanOrEqual(NON_TEXT_MIN)
  })

  it('form-control borders: parchment textarea (near-black/60) and unselected radio box (off-white/50)', () => {
    for (const s of [PAPER_LIGHT, PAPER]) {
      const border = composite(token('near-black'), 0.6, s.rgb)
      expect(contrast(border, s.rgb), s.name).toBeGreaterThanOrEqual(NON_TEXT_MIN)
      expect(contrast(border, PAPER_LIGHT.rgb), s.name).toBeGreaterThanOrEqual(NON_TEXT_MIN)
    }
    for (const s of [BLACK, DARK]) {
      const border = composite(token('off-white'), 0.5, s.rgb)
      expect(contrast(border, s.rgb), s.name).toBeGreaterThanOrEqual(NON_TEXT_MIN)
    }
  })

  it('secondary button outline (gold-dark/60) on dark surfaces', () => {
    for (const s of [BLACK, DARK]) {
      const border = composite(token('gold-dark'), 0.6, s.rgb)
      expect(contrast(border, s.rgb), s.name).toBeGreaterThanOrEqual(NON_TEXT_MIN)
    }
  })
})
