import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import type { EvidenceItem } from '@/types/domain'
import { useAppStore } from '@/store'
import ObservationNoteInput from './ObservationNoteInput'
import Stamp from '@/components/ui/Stamp'
import BureauImage from '@/components/ui/BureauImage'
import PhotoMount from '@/components/ui/PhotoMount'
import { getEvidenceImage } from '@/data/images'

interface EvidencePanelProps {
  evidence: EvidenceItem | null
  onClose: () => void
  readOnly?: boolean
}

/** Unsaved observation drafts, keyed by evidence ID. Intentionally not persisted. */
const draftCache = new Map<string, string>()

export function clearEvidenceDrafts(): void {
  draftCache.clear()
}

interface PanelBodyProps {
  evidence: EvidenceItem
  onClose: () => void
  readOnly: boolean
}

function PanelBody({ evidence, onClose, readOnly }: PanelBodyProps) {
  const reduceMotion = useReducedMotion()
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const savedNote = useAppStore((s) => s.observationNotes[evidence.id] ?? '')
  const [draft, setDraft] = useState<string>(() => draftCache.get(evidence.id) ?? savedNote)

  const handleDraftChange = useCallback(
    (value: string) => {
      draftCache.set(evidence.id, value)
      setDraft(value)
    },
    [evidence.id],
  )

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    panelRef.current?.focus()
    return () => previous?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      // Keep Tab / Shift+Tab inside the modal panel.
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), textarea:not([disabled]), a[href]'),
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      const outside = !panelRef.current.contains(active) || active === panelRef.current
      if (e.shiftKey && (active === first || outside)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || outside)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50">
      <div
        data-testid="evidence-scrim"
        className="absolute inset-0 bg-bureau-black/70"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        initial={reduceMotion ? false : { x: '100%' }}
        animate={{ x: 0 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.25, ease: 'easeOut' }}
        className="texture-paper absolute right-0 top-0 flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto overscroll-contain border-l-2 border-gold-dark bg-parchment-light p-5 text-near-black shadow-sheet focus:outline-none sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="type-label text-near-black/70">EXHIBIT {evidence.id}</span>
            <span className="type-label rounded-sm bg-forest-dark px-2 py-0.5 text-off-white">
              {evidence.category}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close evidence panel"
            className="focus-ring-paper touch-target-icon -mr-2 -mt-2 inline-flex flex-shrink-0 items-center justify-center rounded-sm text-near-black hover:bg-parchment-dark"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <h2 id={titleId} className="type-title break-words text-near-black">
          {evidence.name}
        </h2>

        <BureauImage
          asset={getEvidenceImage(evidence.id)}
          aspect="4/3"
          treatment="photo"
          className="h-44 flex-shrink-0 sm:h-auto"
          fallback={<PhotoMount label="EVIDENCE PHOTOGRAPH — NOT ON FILE" reference={`REF ${evidence.id}`} />}
        />

        <p className="type-body text-near-black/90">
          {evidence.description}
        </p>

        <Stamp tone="red" rotate={-6} size="sm" className="self-start opacity-60">
          LOGGED INTO EVIDENCE
        </Stamp>

        {readOnly ? (
          <div className="flex flex-col gap-1">
            <span className="type-label text-near-black/70">Investigator observation</span>
            <p className="type-body-sm text-near-black/90">
              {savedNote || 'No observation recorded.'}
            </p>
          </div>
        ) : (
          <ObservationNoteInput
            evidenceId={evidence.id}
            draft={draft}
            onDraftChange={handleDraftChange}
          />
        )}
      </motion.div>
    </div>
  )
}

export default function EvidencePanel({ evidence, onClose, readOnly = false }: EvidencePanelProps) {
  if (!evidence) return null
  return <PanelBody key={evidence.id} evidence={evidence} onClose={onClose} readOnly={readOnly} />
}
