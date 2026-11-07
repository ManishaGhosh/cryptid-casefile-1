import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { EASE } from '@/utils/motion'
import { ArrowLeft, ClipboardList } from 'lucide-react'
import { useAppStore } from '@/store'
import { useCaseProgress } from '@/hooks/useCaseProgress'
import EvidenceSlotGrid from '@/components/features/case/EvidenceSlotGrid'
import ClassificationBadge from '@/components/ui/ClassificationBadge'
import StatusBadge from '@/components/ui/StatusBadge'
import IncidentReport from '@/components/features/case/IncidentReport'
import WitnessStatements from '@/components/features/case/WitnessStatements'
import FiledReportSummary from '@/components/features/case/FiledReportSummary'
import Panel from '@/components/ui/Panel'
import Stamp from '@/components/ui/Stamp'
import { buttonClasses } from '@/components/ui/Button'

/**
 * One-shot "folder opening" reveal: a dark cover panel bearing the case number lifts away
 * (<= 400ms). Keyed by caseId at the call site so it plays once per navigation. Purely visual:
 * aria-hidden, pointer-events-none (never blocks input or traps focus). Skipped when reduced.
 */
function CaseOpeningCover({ caseNumber }: { caseNumber: string }) {
  const reduced = useReducedMotion() ?? false
  const [done, setDone] = useState(false)
  if (reduced || done) return null
  return (
    <motion.div
      aria-hidden="true"
      data-testid="case-cover"
      className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center bg-bureau-dark pt-24"
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.38, ease: [...EASE.out] }}
      onAnimationComplete={() => setDone(true)}
    >
      <span className="type-label border-y border-gold-dark/40 px-4 py-1 text-gold-dark">
        {caseNumber}
      </span>
    </motion.div>
  )
}

export default function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>()
  const {
    caseData,
    status: currentStatus,
    collectedCount: collected,
    totalCount: total,
    isClosed,
  } = useCaseProgress(caseId)
  const report = useAppStore((s) => (caseId ? s.reports[caseId] : undefined))
  const setCaseStatus = useAppStore((s) => s.setCaseStatus)

  // Opening a case starts it.
  useEffect(() => {
    if (caseData && currentStatus === 'new') setCaseStatus(caseData.id, 'in-progress')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseData?.id])

  if (!caseData) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <Panel tone="alert" eyebrow="REFERENCE ERROR" className="text-center">
          <div className="mb-4">
            <Stamp tone="red" surface="dark" size="sm" rotate={-5}>
              NO RECORD
            </Stamp>
          </div>
          <h1 className="type-label mb-2 text-blood-text">FILE NOT FOUND</h1>
          <p className="type-body mb-6 text-off-white/70">No case file matches this reference.</p>
          <Link to="/" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
            <ArrowLeft className="h-3 w-3" aria-hidden="true" />
            Bureau HQ
          </Link>
        </Panel>
      </div>
    )
  }

  const canOpenBoard = collected > 0

  return (
    <div className="relative min-h-app">
      <CaseOpeningCover key={caseData.id} caseNumber={caseData.id.toUpperCase()} />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-8">
          <Link
            to="/"
            className="type-label focus-ring touch-target mb-2 inline-flex items-center gap-1 rounded-sm text-gold/80 transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden="true" />
            Bureau HQ
          </Link>
          <div className="type-label mb-2 text-gold/80">{caseData.id.toUpperCase()}</div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h1 className="type-display text-off-white">{caseData.title}</h1>
            <StatusBadge status={currentStatus} />
            <ClassificationBadge level={caseData.classification} />
          </div>
        </header>

        {/* Two columns only from xl (1280px). At lg the fixed sidebar leaves ~720px, which is
            better spent on a single full-width reading column with the actions panel below. */}
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          <div className="min-w-0 space-y-8 xl:col-span-2">
            <IncidentReport caseData={caseData} />
            <WitnessStatements statements={caseData.witnessStatements} />

            {/* Evidence slots — task 4.4 */}
            <section aria-labelledby="evidence-heading">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 id="evidence-heading" className="type-title text-off-white/90">
                  Field Evidence
                </h2>
                <span className="type-label">
                  {collected} / {total} logged
                </span>
              </div>
              <EvidenceSlotGrid caseId={caseData.id} />
            </section>
          </div>

          <aside className="min-w-0 space-y-6 self-start xl:sticky xl:top-24" aria-label="Investigation actions">
            <Panel as="div" eyebrow="FIELD ACTIONS" reference={caseData.id.toUpperCase()}>
              <h2 className="type-heading mb-4 flex items-center gap-2 text-off-white/90">
                <ClipboardList className="h-4 w-4 text-gold/70" aria-hidden="true" />
                Investigation Actions
              </h2>
              <div className="mb-4 flex items-center justify-between">
                <span className="type-label">EVIDENCE COLLECTED</span>
                <span className="type-meta text-gold">
                  {collected}/{total}
                </span>
              </div>

              {!isClosed &&
                (canOpenBoard ? (
                  <Link
                    to={`/case/${caseData.id}/board`}
                    className={buttonClasses({ variant: 'secondary', className: 'w-full' })}
                  >
                    OPEN INVESTIGATION BOARD
                  </Link>
                ) : (
                  <>
                    <span
                      role="link"
                      aria-disabled="true"
                      className={buttonClasses({ variant: 'ghost', className: 'w-full hover:border-off-white/20 hover:text-off-white/80' })}
                    >
                      OPEN INVESTIGATION BOARD
                    </span>
                    <p className="type-body-sm mt-3 text-off-white/60">
                      Collect at least one piece of field evidence to open the board.
                    </p>
                  </>
                ))}
            </Panel>

            {isClosed && report && <FiledReportSummary report={report} />}
          </aside>
        </div>
      </div>
    </div>
  )
}