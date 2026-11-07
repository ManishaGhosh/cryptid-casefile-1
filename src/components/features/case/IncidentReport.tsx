import { Paperclip } from 'lucide-react'
import type { Case } from '@/types/domain'
import BureauImage from '@/components/ui/BureauImage'
import PhotoMount from '@/components/ui/PhotoMount'
import Stamp from '@/components/ui/Stamp'
import { getCaseImage } from '@/data/images'

/** Typed-form field: boxed cell with a mono caption and a mono value. */
function FormField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border border-near-black/25 px-3 py-2">
      <dt className="type-label text-near-black/70">{label}</dt>
      <dd className="type-meta mt-0.5 break-words font-semibold uppercase">{value}</dd>
    </div>
  )
}

/** Incident report rendered as a typed paper form with a red classification stamp. */
export default function IncidentReport({ caseData }: { caseData: Case }) {
  return (
    <article
      aria-label="Incident report"
      className="texture-paper relative flow-root rounded-sm border border-parchment-dark bg-parchment-light p-5 text-near-black shadow-paper sm:p-8"
    >
      {/*
        Label and stamp share a wrapping row instead of the stamp being absolutely positioned:
        on a narrow article the stamp drops below the label rather than printing over it.
      */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="type-label min-w-[12rem] flex-1 break-words text-near-black/70">
          FEDERAL BUREAU OF CRYPTID INVESTIGATION — INCIDENT REPORT
        </div>
        <Stamp
          tone="red"
          rotate={6}
          label={`Classification: ${caseData.classification}`}
          className="mx-1 max-w-full flex-shrink-0 break-words"
        >
          {caseData.classification}
        </Stamp>
      </div>
      <dl className="mb-6 grid grid-cols-1 gap-px md:grid-cols-3">
        <FormField label="FILE NO." value={caseData.id} />
        <FormField label="DATE" value={caseData.incidentDate} />
        <FormField label="LOCATION" value={caseData.location} />
      </dl>
      {/* Clipped field photograph; the narrative wraps around it from md up. */}
      <figure className="relative mx-auto mb-6 mt-3 w-full max-w-xs -rotate-1 md:float-right md:mb-4 md:ml-6 md:mt-0 md:w-72">
        <Paperclip
          className="absolute -top-3 left-6 z-10 h-6 w-6 rotate-12 text-near-black/60"
          aria-hidden="true"
        />
        <BureauImage
          asset={getCaseImage(caseData.id)}
          aspect="16/9"
          treatment="photo"
          className="h-40 sm:h-auto"
          fallback={<PhotoMount label="FIELD PHOTOGRAPH — NOT ON FILE" reference={`REF ${caseData.id.toUpperCase()}`} />}
        />
      </figure>
      <h2 className="type-title mb-4 break-words text-near-black">{caseData.title}</h2>
      <p className="type-body whitespace-pre-line break-words text-near-black/90">{caseData.narrative}</p>
    </article>
  )
}
