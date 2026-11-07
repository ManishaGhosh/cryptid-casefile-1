import { FileText, NotebookPen } from 'lucide-react'
import { useAppStore } from '@/store'
import type { EvidenceItem } from '@/types/domain'
import BureauImage from '@/components/ui/BureauImage'
import { getEvidenceImage } from '@/data/images'

interface EvidenceCardProps {
  evidence: EvidenceItem
}

/** Collected-state field report tag: aged paper, punched hole with string, exhibit number, category chip. */
export default function EvidenceCard({ evidence }: EvidenceCardProps) {
  const hasNote = useAppStore((s) => Boolean(s.observationNotes[evidence.id]?.trim()))

  return (
    <div className="texture-paper relative h-full bg-parchment-light p-4 pl-10 text-near-black">
      {/* Punched tag hole + tie string (decorative) */}
      <span aria-hidden="true" className="absolute left-[18px] top-0 h-3 w-px bg-near-black/40" />
      <span
        aria-hidden="true"
        className="absolute left-3 top-3 h-3.5 w-3.5 rounded-full border border-near-black/40 bg-bureau-dark"
      />
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="type-label text-near-black/70">EXHIBIT {evidence.id}</span>
        <span className="type-label rounded-sm bg-forest-dark px-2 py-0.5 text-off-white">
          {evidence.category.toUpperCase()}
        </span>
      </div>
      {/* No placeholder: with no image on file the card is exactly as it was. */}
      <BureauImage
        asset={getEvidenceImage(evidence.id)}
        aspect="4/3"
        treatment="photo"
        className="w-32"
        fallback={null}
        loadedClassName="mb-3"
      />
      <h3 className="type-heading mb-2 break-words text-near-black">{evidence.name}</h3>
      <p className="type-body-sm mb-3 line-clamp-3 text-near-black/80">{evidence.description}</p>
      <div className="flex items-center justify-between gap-2 border-t border-near-black/15 pt-2">
        <span className="type-label inline-flex items-center gap-1 text-near-black/70">
          <FileText className="h-3 w-3" aria-hidden="true" />
          View dossier
        </span>
        {hasNote && (
          <span className="type-label inline-flex items-center gap-1 text-forest-dark">
            <NotebookPen className="h-3 w-3" aria-hidden="true" />
            NOTE LOGGED
          </span>
        )}
      </div>
    </div>
  )
}
