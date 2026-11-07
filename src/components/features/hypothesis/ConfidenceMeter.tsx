import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '@/utils/cn'

export interface ConfidenceMeterProps {
  score: number
  label?: string
  /** Count up / fill segments left to right on mount (visual only; ARIA value is always final). */
  animate?: boolean
  /** Delay before the fill starts, in ms. */
  startDelayMs?: number
  /** Fill duration in ms. */
  durationMs?: number
}

const SEGMENTS = 10

function tone(score: number): { text: string; fill: string } {
  // Lighter green / red than the base tokens: the meter always sits on a dark surface and the
  // numeral (large text) needs >= 3:1, the segments (graphics) >= 3:1.
  if (score >= 75) return { text: 'text-forest-text', fill: 'bg-forest-text' }
  if (score >= 40) return { text: 'text-gold', fill: 'bg-gold' }
  return { text: 'text-blood-text', fill: 'bg-blood-text' }
}

export default function ConfidenceMeter({
  score,
  label = 'Confidence score',
  animate = false,
  startDelayMs = 0,
  durationMs = 400,
}: ConfidenceMeterProps) {
  const reduced = useReducedMotion() ?? false
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const run = animate && !reduced
  const [shown, setShown] = useState(run ? 0 : clamped)

  useEffect(() => {
    if (!run) return
    setShown(0)
    let raf = 0
    let start: number | null = null
    const tick = (now: number): void => {
      if (start === null) start = now
      const t = Math.min(1, (now - start) / durationMs)
      setShown(Math.round(clamped * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    const timer = setTimeout(() => {
      raf = requestAnimationFrame(tick)
    }, startDelayMs)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [run, clamped, startDelayMs, durationMs])

  const display = run ? shown : clamped
  const filled = Math.round(display / SEGMENTS)
  const { text, fill } = tone(clamped)

  return (
    <div className="flex items-center gap-4">
      <div className={cn('font-serif text-4xl leading-none tabular-nums', text)} aria-hidden="true">
        {display}%
      </div>
      <div className="flex-1">
        <p className="type-label mb-1.5" aria-hidden="true">
          {label}
        </p>
        <div
          role="meter"
          aria-label={label}
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${clamped} percent`}
          className="flex gap-1"
        >
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <span
              key={i}
              className={cn('h-2.5 flex-1 rounded-sm', i < filled ? fill : 'bg-off-white/10')}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
