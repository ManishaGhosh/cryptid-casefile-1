import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import BureauImage from '@/components/ui/BureauImage'
import { CASES } from '@/data/cases'
import { getCryptidImage } from '@/data/images'
import { cn } from '@/utils/cn'
import type { ArchiveEntryModel } from '@/hooks/useArchive'

interface DossierDetailProps {
  entry: ArchiveEntryModel
  onClose: () => void
}

export default function DossierDetail({ entry, onClose }: DossierDetailProps) {
  const { cryptid, linkedCaseId, reportFiledAt } = entry
  const [portraitLoaded, setPortraitLoaded] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
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
  }, [])

  const portrait = entry.unlocked && !entry.sealed ? getCryptidImage(cryptid.id) : null

  const linkedCase = CASES.find((c) => c.id === linkedCaseId)
  const hasReport = Boolean(reportFiledAt)
  const linkTo = linkedCaseId ? (hasReport ? `/case/${linkedCaseId}/report` : `/case/${linkedCaseId}`) : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
      onClick={onClose}
      data-testid="dossier-scrim"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dossier-title"
        className="texture-paper relative max-h-full w-full max-w-2xl overflow-y-auto overscroll-contain rounded-sm border border-parchment-dark bg-parchment-light p-5 text-near-black shadow-sheet sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          aria-label="Close dossier"
          onClick={onClose}
          className="focus-ring-paper touch-target-icon absolute right-2 top-2 inline-flex items-center justify-center rounded-sm text-near-black/70 hover:text-near-black"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <p className="type-label pr-10 text-near-black/70">FILE REF: {cryptid.id.toUpperCase()}</p>
        <h2 id="dossier-title" className="type-display mt-1 pr-10 text-near-black">
          {cryptid.name}
        </h2>
        <p className="type-label mt-1 text-blood-dark">{cryptid.classification}</p>

        {/* Thin CSS plate band: the whole experience until (and unless) a portrait has loaded. */}
        {!portraitLoaded && <div aria-hidden="true" className="plate mt-4 h-16 rounded-sm border border-near-black/50" />}

        <div className={cn(portraitLoaded && 'mt-4 flex flex-col gap-4 sm:flex-row sm:items-start')}>
          {portrait && (
            <div className={cn(portraitLoaded && 'w-full shrink-0 sm:w-52')}>
              <BureauImage
                asset={portrait}
                aspect="4/5"
                treatment="plate"
                className="max-h-72 overflow-hidden sm:max-h-none"
                imgClassName="object-cover object-[center_30%]"
                fallback={null}
                onStateChange={(s) => setPortraitLoaded(s === 'loaded')}
              />
            </div>
          )}
          <div className={cn('min-w-0 flex-1', portraitLoaded && '[&>section:first-child]:mt-0')}>
            <section className="mt-5">
              <h3 className="type-label mb-1 text-near-black/70">DESCRIPTION</h3>
              <p className="type-body text-near-black/90">{cryptid.description}</p>
            </section>

            <section className="mt-5">
              <h3 className="type-label mb-1 text-near-black/70">BEHAVIOUR</h3>
              <p className="type-body text-near-black/90">{cryptid.behaviour}</p>
            </section>
          </div>
        </div>

        <section className="mt-5">
          <h3 className="type-label mb-1 text-near-black/70">SIGNATURE TRAITS</h3>
          <ul className="type-body-sm list-disc space-y-0.5 pl-5 text-near-black/90">
            {cryptid.signatureTraits.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        <section className="mt-5">
          <h3 className="type-label mb-1 text-near-black/70">FIELD NOTES</h3>
          <blockquote className="border-l-2 border-gold-dark pl-3 font-serif text-step-heading italic leading-relaxed text-near-black/90">
            {cryptid.loreExcerpt}
          </blockquote>
        </section>

        {linkedCase && linkTo && (
          <p className="type-body-sm mt-6 text-near-black/90">
            Identified in{' '}
            <Link to={linkTo} className="focus-ring-paper rounded-sm text-forest-dark underline hover:text-forest">
              {linkedCase.title}
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
