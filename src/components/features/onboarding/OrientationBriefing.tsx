import { useEffect, useRef, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Shield } from 'lucide-react'
import BureauImage from '@/components/ui/BureauImage'
import Button from '@/components/ui/Button'
import Stamp from '@/components/ui/Stamp'
import { BRIEFING_STEPS, type BriefingVisual } from '@/data/onboarding'
import { BRAND_EMBLEM } from '@/data/images'
import { useOnboarding } from '@/hooks/useOnboarding'
import { cn } from '@/utils/cn'
import { fadeUp } from '@/utils/motion'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])'
const TITLE_ID = 'briefing-title'
const BODY_ID = 'briefing-body'
const TOTAL = BRIEFING_STEPS.length

const CARD = 'rounded-sm border border-near-black/40 bg-parchment-dark/60'

/** CSS-only mini illustrations built from the app's own visual language. Purely decorative. */
function StepVisual({ visual }: { visual: BriefingVisual }) {
  let art: ReactNode
  switch (visual) {
    case 'emblem':
      art = (
        <BureauImage
          asset={BRAND_EMBLEM}
          aspect="1/1"
          decorative
          priority
          className="h-24 w-24"
          imgClassName="object-contain"
          fallback={
            <div className="flex h-full w-full items-center justify-center rounded-sm border border-gold-dark bg-gold-dark/15">
              <Shield className="h-9 w-9 text-gold-dark" aria-hidden="true" />
            </div>
          }
        />
      )
      break
    case 'case-files':
      art = (
        <div className="w-32">
          <div className="ml-2 h-3 w-14 rounded-t-sm border border-b-0 border-near-black/50 bg-gold-dark/30" />
          <div className={cn(CARD, 'space-y-1.5 p-2.5')}>
            <div className="font-mono text-[11px] uppercase tracking-widest text-near-black/70">Case 001</div>
            <div className="h-px bg-near-black/30" />
            <div className="font-mono text-[11px] uppercase tracking-widest text-forest">New</div>
          </div>
        </div>
      )
      break
    case 'evidence':
      art = (
        <div className="w-32 space-y-2">
          <div className={cn(CARD, 'relative overflow-hidden px-2 py-3 text-center')}>
            <span className="font-mono text-[11px] uppercase tracking-widest text-near-black/70">
              Contents classified
            </span>
          </div>
          <div className="inline-block rounded-sm border border-forest px-2 py-0.5 font-mono text-[11px] uppercase tracking-widest text-forest">
            Logged
          </div>
        </div>
      )
      break
    case 'board':
      art = (
        <div className="relative h-20 w-36">
          <div className={cn(CARD, 'absolute left-0 top-1 h-10 w-14')} />
          <div className={cn(CARD, 'absolute bottom-1 right-0 h-10 w-14')} />
          <div className="absolute left-[3.25rem] top-[1.6rem] h-0.5 w-[4.5rem] origin-left rotate-[14deg] bg-blood-light" />
          <div className="absolute left-12 top-3 h-2.5 w-2.5 rounded-full bg-blood-light" />
          <div className="absolute bottom-3 right-12 h-2.5 w-2.5 rounded-full bg-blood-light" />
        </div>
      )
      break
    case 'hypothesis':
      art = (
        <Stamp tone="green" size="md" rotate={-6} animate>
          Identified
        </Stamp>
      )
      break
    case 'report':
      art = (
        <Stamp tone="red" size="md" rotate={-6} animate>
          Case closed
        </Stamp>
      )
      break
  }
  return (
    <div aria-hidden="true" className="flex min-h-[7rem] items-center justify-center sm:w-40 sm:flex-shrink-0">
      {art}
    </div>
  )
}

export default function OrientationBriefing() {
  const open = useOnboarding((s) => s.open)
  const stepIndex = useOnboarding((s) => s.stepIndex)
  const dialogRef = useRef<HTMLDivElement>(null)
  const primaryRef = useRef<HTMLButtonElement>(null)
  const reduced = useReducedMotion() ?? false

  // Remember what had focus; give it back (or fall back to the page) when the briefing closes.
  useEffect(() => {
    if (!open) return
    const active = document.activeElement
    const previous = active instanceof HTMLElement && active !== document.body ? active : null
    return () => {
      const target =
        previous && previous.isConnected && !previous.closest('[inert]')
          ? previous
          : document.getElementById('main-content')
      target?.focus()
    }
  }, [open])

  // Keep keyboard users oriented: the primary action takes focus on open and on every step change.
  useEffect(() => {
    if (open) primaryRef.current?.focus()
  }, [open, stepIndex])

  // Escape = skip; Tab is trapped; arrows navigate when focus is not in a text field.
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent): void {
      const dialog = dialogRef.current
      if (!dialog) return
      const ui = useOnboarding.getState()
      if (e.key === 'Escape') {
        e.preventDefault()
        ui.closeBriefing('skip')
        return
      }
      if (e.key === 'Tab') {
        const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE))
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const active = document.activeElement
        if (e.shiftKey && (active === first || !dialog.contains(active))) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && (active === last || !dialog.contains(active))) {
          e.preventDefault()
          first.focus()
        }
        return
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const active = document.activeElement
        if (!active || !dialog.contains(active)) return
        if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement) {
          return
        }
        e.preventDefault()
        if (e.key === 'ArrowRight') ui.next()
        else ui.back()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  if (!open) return null

  const step = BRIEFING_STEPS[stepIndex] ?? BRIEFING_STEPS[0]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === TOTAL - 1
  const { next, back, closeBriefing } = useOnboarding.getState()

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 py-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        aria-describedby={BODY_ID}
        className="texture-paper max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-sm border border-parchment-dark bg-parchment p-5 text-near-black shadow-sheet sm:p-7"
      >
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="type-label text-near-black/70">
              {'FBCI \u2014 ORIENTATION BRIEFING / FORM OB-1'}
            </div>
            <ol aria-hidden="true" className="mt-3 flex gap-1">
              {BRIEFING_STEPS.map((s, i) => (
                <li
                  key={s.id}
                  className={cn(
                    'h-2 w-7 rounded-t-sm border',
                    i === stepIndex
                      ? 'border-gold-dark bg-gold-dark'
                      : i < stepIndex
                        ? 'border-near-black/40 bg-near-black/40'
                        : 'border-near-black/30 bg-transparent',
                  )}
                />
              ))}
            </ol>
          </div>
          {isFirst && (
            <Stamp tone="red" size="sm" rotate={-4} animate>
              Clearance: Omega
            </Stamp>
          )}
        </div>

        <motion.div
          key={step.id}
          variants={fadeUp(reduced)}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6"
        >
          <StepVisual visual={step.visual} />
          <div className="min-w-0 flex-1">
            <div className="type-label text-near-black/70">{step.eyebrow}</div>
            <h2 id={TITLE_ID} className="type-title mt-1 text-near-black">
              {step.title}
            </h2>
            <div id={BODY_ID} className="mt-3 space-y-2">
              {step.body.map((p) => (
                <p key={p} className="type-body text-near-black/80">
                  {p}
                </p>
              ))}
              {step.tip && <p className="type-body-sm text-near-black/70">{'Note: ' + step.tip}</p>}
            </div>
          </div>
        </motion.div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-near-black/20 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => closeBriefing('skip')}
              className="border-near-black/30 text-near-black/80 hover:border-near-black/60 hover:text-near-black"
            >
              Skip briefing
            </Button>
            <span aria-live="polite" className="type-meta text-near-black/70">
              {`Step ${stepIndex + 1} of ${TOTAL}`}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              disabled={isFirst}
              onClick={back}
              className="border-near-black/50 bg-transparent text-near-black hover:border-near-black hover:bg-near-black/10 disabled:hover:border-near-black/50 disabled:hover:bg-transparent"
            >
              Back
            </Button>
            <Button
              ref={primaryRef}
              variant="primary"
              size="sm"
              onClick={isLast ? () => closeBriefing('complete') : next}
            >
              {isLast ? 'Begin investigation' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
