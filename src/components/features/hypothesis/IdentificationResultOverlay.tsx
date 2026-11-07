import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import ConfidenceMeter from './ConfidenceMeter'
import ScanOverlay from '@/components/ui/ScanOverlay'
import Button from '@/components/ui/Button'
import Stamp, { type StampTone } from '@/components/ui/Stamp'
import { fadeUp } from '@/utils/motion'
import { CRYPTIDS } from '@/data/cryptids'
import type { IdentificationOutcome, IdentificationResult } from '@/types/identification'
import { cn } from '@/utils/cn'

export interface IdentificationResultOverlayProps {
  result: IdentificationResult | null
  /** close overlay, return to board */
  onDismiss: () => void
  /** success only; supplied later by task 7.1 */
  onFileReport?: () => void
}

interface OutcomeStyle {
  stamp: string
  tone: StampTone
  borderClass: string
}

const OUTCOME_STYLE: Record<IdentificationOutcome, OutcomeStyle> = {
  success: { stamp: 'IDENTIFIED', tone: 'green', borderClass: 'border-forest-light/60' },
  inconclusive: { stamp: 'INCONCLUSIVE', tone: 'red', borderClass: 'border-blood-light/60' },
  'insufficient-evidence': { stamp: 'INSUFFICIENT EVIDENCE', tone: 'gold', borderClass: 'border-gold/60' },
  'unknown-entity': { stamp: 'UNKNOWN ENTITY', tone: 'red', borderClass: 'border-blood-light/60' },
}

function heading(result: IdentificationResult): string {
  switch (result.outcome) {
    case 'success':
      return `Identification confirmed: ${result.submittedCryptidName}`
    case 'inconclusive':
      return `The evidence does not fit ${result.submittedCryptidName}`
    case 'insufficient-evidence':
      return 'Correct line of inquiry — more evidence needed'
    case 'unknown-entity':
      return 'Entity not found in bureau records'
  }
}

function TraitList({ title, traits }: { title: string; traits: readonly string[] }) {
  if (traits.length === 0) return null
  return (
    <section className="mb-5">
      <h3 className="type-label mb-2 text-gold">{title}</h3>
      <ul className="type-body-sm list-disc space-y-1 pl-5 text-off-white/80">
        {traits.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </section>
  )
}

export default function IdentificationResultOverlay({
  result,
  onDismiss,
  onFileReport,
}: IdentificationResultOverlayProps) {
  const reduce = useReducedMotion() ?? false
  // Brief "analysis" phase (~500ms) with scan sweep; skipped entirely under reduced motion.
  const [analyzing, setAnalyzing] = useState(!reduce)
  const resultKey = result ? `${result.submittedCryptidId}:${result.outcome}:${result.confidenceScore}` : null
  useEffect(() => {
    if (resultKey === null || reduce) {
      setAnalyzing(false)
      return
    }
    setAnalyzing(true)
    const t = setTimeout(() => setAnalyzing(false), 500)
    return () => clearTimeout(t)
  }, [resultKey, reduce])
  const primaryRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss
  const open = result !== null

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    primaryRef.current?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onDismissRef.current()
        return
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled])'),
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [open])

  if (!result) return null

  const style = OUTCOME_STYLE[result.outcome]
  const suspect = CRYPTIDS.find((c) => c.id === result.submittedCryptidId)
  const traits = suspect?.signatureTraits ?? []
  const name = result.submittedCryptidName
  const fileDisabled = onFileReport === undefined

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-3 py-4 sm:px-4 sm:py-6"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0 : 0.3 }}
      onClick={onDismiss}
      data-testid="identification-scrim"
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="identification-result-title"
        className={cn(
          'relative w-full max-w-2xl max-h-full overflow-y-auto overscroll-contain bg-bureau-dark border rounded-sm p-4 sm:p-6',
          style.borderClass,
        )}
        variants={fadeUp(reduce)}
        initial={reduce ? false : 'hidden'}
        animate="show"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <p className="type-label min-w-[12rem] flex-1 break-words">
            IDENTIFICATION ANALYSIS — {name.toUpperCase()}
          </p>
          {/* Verdict stamp lands last (~0.95s); wrapper only delays its appearance. */}
          <motion.div
            className="shrink-0"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.01, delay: reduce ? 0 : 0.95 }}
          >
            <Stamp tone={style.tone} surface="dark" rotate={-6} size="md" animate={!reduce}>
              {style.stamp}
            </Stamp>
          </motion.div>
        </div>

        <h2 id="identification-result-title" className="type-title mb-2 break-words text-off-white">
          {heading(result)}
        </h2>
        <p className="type-body-sm mb-5 text-off-white/80">{result.summary}</p>

        <div className="relative">
        {!reduce && (
          <p
            aria-hidden="true"
            className={cn(
              'type-label mb-2 text-gold transition-opacity duration-300',
              analyzing ? 'opacity-100' : 'opacity-0',
            )}
          >
            CROSS-REFERENCING FIELD EVIDENCE…
          </p>
        )}
        <ScanOverlay active={analyzing} durationMs={500} />
        <div className="mb-5">
          <ConfidenceMeter
            score={result.confidenceScore}
            label={`Match with ${name}'s profile`}
            animate={!reduce}
            startDelayMs={500}
            durationMs={400}
          />
        </div>

        {result.outcome === 'inconclusive' && (
          <p className="type-body-sm mb-5 border-l-2 border-blood-light pl-3 text-off-white/80">
            This verdict is based on your hypothesis, not the confidence score.
          </p>
        )}

        {result.outcome === 'insufficient-evidence' && (
          <section className="mb-5">
            <p className="type-body-sm mb-3 text-gold-light">
              {result.evidenceNeeded} more corroborating {result.evidenceNeeded === 1 ? 'item' : 'items'} required (
              {result.matchingEvidenceCount}/{result.requiredCount ?? 0} logged)
            </p>
            {result.missingCategories.length > 0 && (
              <>
                <h3 className="type-label mb-2 text-gold">
                  Unexamined evidence categories
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {result.missingCategories.map((c) => (
                    <li
                      key={c}
                      className="type-label rounded-sm border border-gold/60 px-2 py-0.5 text-gold-light"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}

        {result.outcome !== 'unknown-entity' && (
          <section className="mb-5">
            <h3 className="type-label mb-2 text-gold">Case analysis</h3>
            {result.assessments.length === 0 ? (
              <p className="type-body-sm text-off-white/60">No evidence has been logged for this case.</p>
            ) : (
              <motion.ul
                className="space-y-2"
                variants={{
                  hidden: { opacity: 1 },
                  show: { opacity: 1, transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: reduce ? 0 : 0.35 } },
                }}
                initial={reduce ? false : 'hidden'}
                animate="show"
              >
                {result.assessments.map((a) => (
                  <motion.li
                    key={a.evidenceId}
                    variants={fadeUp(reduce)}
                    className="flex gap-3 bg-bureau-black/60 border border-off-white/10 rounded-sm p-3"
                  >
                    {/* icon resolves shortly after the row text */}
                    <motion.span
                      className="shrink-0"
                      variants={{
                        hidden: { opacity: reduce ? 1 : 0, scale: reduce ? 1 : 0.6 },
                        show: { opacity: 1, scale: 1, transition: { duration: reduce ? 0 : 0.15, delay: reduce ? 0 : 0.15 } },
                      }}
                    >
                      {a.supportsSuspect ? (
                        <Check className="w-4 h-4 mt-0.5 text-forest-text" aria-hidden="true" />
                      ) : (
                        <X className="w-4 h-4 mt-0.5 text-blood-text" aria-hidden="true" />
                      )}
                    </motion.span>
                    <div className="min-w-0">
                      <p className="type-body-sm break-words text-off-white">
                        <span className="sr-only">{a.supportsSuspect ? 'Supports: ' : 'Does not support: '}</span>
                        {a.evidenceName}
                        <span className="type-label ml-2 rounded-sm border border-off-white/30 px-1.5 py-0.5 text-off-white/70">
                          {a.category}
                        </span>
                      </p>
                      <p className="type-body-sm mt-1 text-off-white/70">{a.explanation}</p>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </section>
        )}
        </div>

        {result.outcome === 'success' && <TraitList title="Profile corroborated" traits={traits} />}
        {result.outcome === 'inconclusive' && <TraitList title="Expected profile" traits={traits} />}

        <div className="flex flex-wrap items-center justify-end gap-3">
          {result.outcome === 'success' && (
            <>
              <Button ref={fileDisabled ? primaryRef : undefined} variant="ghost" onClick={onDismiss}>
                Return to board
              </Button>
              <Button
                ref={fileDisabled ? undefined : primaryRef}
                variant="secondary"
                onClick={onFileReport}
                disabled={fileDisabled}
                className="border-gold bg-gold-dark/30 text-gold-light hover:bg-gold-dark/50"
              >
                {fileDisabled ? 'Report filing available shortly' : 'File Report'}
              </Button>
            </>
          )}
          {result.outcome === 'inconclusive' && (
            <Button ref={primaryRef} variant="secondary" onClick={onDismiss}>
              Revise hypothesis
            </Button>
          )}
          {result.outcome === 'insufficient-evidence' && (
            <Button ref={primaryRef} variant="secondary" onClick={onDismiss}>
              Continue investigating
            </Button>
          )}
          {result.outcome === 'unknown-entity' && (
            <Button ref={primaryRef} variant="secondary" onClick={onDismiss}>
              Return to board
            </Button>
          )}
        </div>      </motion.div>
    </motion.div>
  )
}
