import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import ConfidenceMeter from '@/components/features/hypothesis/ConfidenceMeter'
import ClassificationBadge from '@/components/ui/ClassificationBadge'
import BureauImage from '@/components/ui/BureauImage'
import PhotoMount from '@/components/ui/PhotoMount'
import Stamp from '@/components/ui/Stamp'
import { getCaseImage, getCryptidImage, getEvidenceImage } from '@/data/images'
import StatusLight from '@/components/ui/StatusLight'
import { fadeUp, staggerChildren } from '@/utils/motion'
import type { ClassificationLevel } from '@/types/domain'
import type { InvestigationReport } from '@/types/report'
import { formatTimestamp } from '@/utils/formatDate'

const LEVELS: readonly ClassificationLevel[] = [
  'LEVEL 1 — UNCLASSIFIED',
  'LEVEL 2 — RESTRICTED',
  'LEVEL 3 — RESTRICTED',
  'LEVEL 4 — CONFIDENTIAL',
  'LEVEL 5 — EYES ONLY',
]

function isClassificationLevel(value: string): value is ClassificationLevel {
  return (LEVELS as readonly string[]).includes(value)
}

function exhibitLabel(index: number): string {
  return `EXHIBIT ${String.fromCharCode(65 + (index % 26))}${index >= 26 ? Math.floor(index / 26) : ''}`
}

export interface ReportDocumentProps {
  report: InvestigationReport
  /** True only on the first view right after filing (router state); plays the case-closing entrance. */
  justFiled?: boolean
}

/** Renders the stored report snapshot only; never recalculates from live evidence. */
export default function ReportDocument({ report, justFiled = false }: ReportDocumentProps) {
  const reduced = useReducedMotion() ?? false
  const block = fadeUp(reduced)
  const initial = justFiled ? 'hidden' : false
  const refId = report.caseId.toUpperCase()

  return (
    <motion.article
      data-entrance={justFiled ? 'filed' : 'static'}
      variants={staggerChildren(reduced, 0.1)}
      initial={initial}
      animate="show"
      aria-labelledby="report-title"
      className="texture-paper texture-scanline relative mx-auto w-full max-w-4xl bg-parchment-light p-5 text-near-black shadow-sheet sm:p-8 md:p-14"
    >
      <motion.header variants={block} className="relative border-b-2 border-near-black/70 pb-6 mb-8">
        <p className="type-label break-words tracking-[0.15em] text-near-black/70 sm:tracking-[0.3em]">
          FEDERAL BUREAU OF CRYPTID INVESTIGATION
        </p>
        <h1 id="report-title" className="type-display mt-2 pr-0 md:pr-56">
          Final Investigation Report
        </h1>
        <p className="type-label mt-3 break-words text-near-black/70">
          REF {refId} / FILED {formatTimestamp(report.filedAt)}
        </p>
        <div className="mt-3 inline-block bg-bureau-black px-2 py-1 rounded-sm">
          {isClassificationLevel(report.caseClassification) ? (
            <ClassificationBadge level={report.caseClassification} />
          ) : (
            <span className="type-label text-off-white/70">
              {report.caseClassification}
            </span>
          )}
        </div>
        {/* In flow below md so the stamp never sits over the title; pinned top-right from md up. */}
        <motion.div
          className="mt-5 opacity-80 md:absolute md:right-0 md:top-2 md:mt-0"
          initial={justFiled && !reduced ? { opacity: 0 } : false}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 0.01, delay: 0.9 }}
        >
          <Stamp tone="red" rotate={-12} size="lg" animate={justFiled}>
            CASE CLOSED
          </Stamp>
        </motion.div>
        <span className="sr-only">Status: case closed</span>
      </motion.header>

      <motion.section variants={block} aria-labelledby="report-s1" className="mb-10">
        <h2 id="report-s1" className="type-label mb-3 text-near-black/70">
          I. CASE PARTICULARS
        </h2>
        <BureauImage
          asset={getCaseImage(report.caseId)}
          aspect="16/9"
          treatment="photo"
          className="mb-5 h-32 max-w-xs sm:h-auto"
          fallback={<PhotoMount label="FIELD PHOTOGRAPH — NOT ON FILE" reference="ATTACHMENT A" />}
        />
        <dl className="type-body-sm grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-[10rem_1fr]">
          <dt className="type-label text-near-black/70">CASE TITLE</dt>
          <dd className="type-heading break-words">{report.caseTitle}</dd>
          <dt className="type-label text-near-black/70">LOCATION</dt>
          <dd className="break-words">{report.location}</dd>
          <dt className="type-label text-near-black/70">INCIDENT DATE</dt>
          <dd className="uppercase">{report.incidentDate}</dd>
          <dt className="type-label text-near-black/70">CLASSIFICATION</dt>
          <dd>{report.caseClassification}</dd>
        </dl>
      </motion.section>

      <motion.section variants={block} aria-labelledby="report-s2" className="mb-10">
        <h2 id="report-s2" className="type-label mb-3 text-near-black/70">
          II. DETERMINATION
        </h2>
        {/* No placeholder: the determination reads exactly as before until a plate is on file. */}
        <BureauImage
          asset={getCryptidImage(report.identifiedCryptidId)}
          aspect="4/5"
          treatment="photo"
          className="w-24"
          loadedClassName="mb-3"
          fallback={null}
        />
        <p className="type-title">{report.identifiedCryptidName}</p>
        <p className="type-label mt-1 text-near-black/70">
          {report.identifiedCryptidClassification}
        </p>
        <div className="bg-bureau-black rounded-sm p-4 my-4">
          <ConfidenceMeter score={report.confidenceScore} label="Investigator confidence" />
        </div>
        <p className="type-body-sm">{report.analysisSummary}</p>
        <p className="type-label mt-3 text-near-black/70">
          {report.matchingEvidenceCount} of {report.totalAssociatedEvidence} profile indicators corroborated
        </p>
      </motion.section>

      <motion.section variants={block} aria-labelledby="report-s3" className="mb-10">
        <h2 id="report-s3" className="type-label mb-3 text-near-black/70">
          III. EVIDENCE OF RECORD
        </h2>
        <ol className="space-y-5">
          {report.collectedEvidence.map((entry, i) => (
            <li key={entry.evidenceId} className="relative break-words border border-near-black/30 p-4 pl-10">
              {/* Evidence-tag detail: punched hole + tie string (decorative) */}
              <span aria-hidden="true" className="absolute left-[18px] top-0 h-3 w-px bg-near-black/40" />
              <span aria-hidden="true" className="absolute left-3 top-3 h-3.5 w-3.5 rounded-full border border-near-black/40 bg-bureau-dark" />
              <div className="flex flex-wrap items-center gap-3">
                <span className="type-label text-blood-dark">{exhibitLabel(i)}</span>
                <h3 className="type-heading">{entry.name}</h3>
                <span className="type-label rounded-sm border border-near-black/40 px-1.5 py-0.5 text-near-black/70">
                  {entry.category}
                </span>
              </div>
              <BureauImage
                asset={getEvidenceImage(entry.evidenceId)}
                aspect="4/3"
                treatment="photo"
                className="w-28"
                loadedClassName="mt-3"
                fallback={null}
              />
              <p className="type-body-sm mt-2">{entry.description}</p>
              <p className="type-body-sm mt-3 flex items-start gap-2">
                {entry.supportsIdentification ? (
                  <Check aria-hidden="true" className="w-4 h-4 mt-0.5 shrink-0 text-forest-dark" />
                ) : (
                  <X aria-hidden="true" className="w-4 h-4 mt-0.5 shrink-0 text-blood-dark" />
                )}
                <span>
                  <span className="type-label text-near-black/70">
                    Analyst finding:{' '}
                  </span>
                  <span className="sr-only">
                    {entry.supportsIdentification ? '(supports identification) ' : '(does not support identification) '}
                  </span>
                  {entry.rationale}
                </span>
              </p>
              <p className="type-body-sm mt-2">
                <span className="type-label text-near-black/70">
                  Investigator observation:{' '}
                </span>
                {entry.observationNote.trim() ? (
                  <span className="italic">{entry.observationNote}</span>
                ) : (
                  <span className="text-near-black/70">— No observation recorded</span>
                )}
              </p>
            </li>
          ))}
        </ol>
      </motion.section>

      <motion.section variants={block} aria-labelledby="report-s4" className="mb-10">
        <h2 id="report-s4" className="type-label mb-3 text-near-black/70">
          IV. INVESTIGATIVE CONNECTIONS
        </h2>
        <p className="type-body-sm mb-2">Connections drawn on the board: {report.connectionCount}</p>
        {report.connectionNotes.length > 0 ? (
          <ul className="type-body-sm list-disc space-y-1 pl-5">
            {report.connectionNotes.map((note, i) => (
              <li key={`${i}-${note}`}>{note}</li>
            ))}
          </ul>
        ) : (
          <p className="type-body-sm text-near-black/70">No annotated connections were recorded.</p>
        )}
      </motion.section>

      <motion.footer variants={block} className="border-t-2 border-near-black/70 pt-6">
        <p className="type-heading font-normal italic">Investigator Hale · Badge 7714</p>
        <p className="type-label mt-4 tracking-[0.3em] text-near-black/70">END OF REPORT</p>
        <motion.p
          className="type-body-sm mt-4"
          initial={justFiled && !reduced ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 1.2 }}
        >
          <StatusLight tone="green" onPaper label="Archive entry active" className="mr-2 align-middle" />
          Archive entry unlocked: {report.identifiedCryptidName}{' '}
          <Link to="/archive" className="focus-ring-paper rounded-sm font-semibold text-blood-dark underline hover:text-blood">
            Open the Archive
          </Link>
        </motion.p>
      </motion.footer>
    </motion.article>
  )
}
