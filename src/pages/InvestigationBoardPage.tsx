import { useRef } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import FlowCanvas from '@/components/features/board/FlowCanvas'
import BoardMinimap from '@/components/features/board/BoardMinimap'
import BoardEvidenceTray from '@/components/features/board/BoardEvidenceTray'
import HypothesisPanel from '@/components/features/hypothesis/HypothesisPanel'
import StatusBadge from '@/components/ui/StatusBadge'
import Panel from '@/components/ui/Panel'
import { buttonClasses } from '@/components/ui/Button'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { useCaseProgress } from '@/hooks/useCaseProgress'

function StaticEvidenceList({ caseId }: { caseId: string }) {
  const { evidenceItems, collectedIds } = useCaseProgress(caseId)
  const collected = evidenceItems.filter((e) => collectedIds.includes(e.id))
  return (
    <div role="alert" className="h-full overflow-y-auto">
      <Panel tone="alert" eyebrow="BOARD UNAVAILABLE">
        <h2 className="type-heading text-gold">Collected evidence</h2>
        <ul className="type-body-sm mt-3 list-disc pl-5 text-off-white">
          {collected.map((e) => (
            <li key={e.id}>{e.name}</li>
          ))}
        </ul>
        <Link
          to={`/case/${caseId}`}
          className={buttonClasses({ variant: 'secondary', size: 'sm', className: 'mt-4' })}
        >
          Return to case file
        </Link>
      </Panel>
    </div>
  )
}

export default function InvestigationBoardPage() {
  const { caseId = '' } = useParams<{ caseId: string }>()
  const { caseData, status, collectedCount } = useCaseProgress(caseId)
  // Whether the case was already closed when this board was entered.
  const entry = useRef({ caseId, closed: status === 'closed' })
  if (entry.current.caseId !== caseId) entry.current = { caseId, closed: status === 'closed' }

  if (!caseData) return <Navigate to="/" replace />
  if (status === 'closed') {
    // Entering a closed board → case file. Closing it here means a report was just filed:
    // go to the report (otherwise this redirect would override the async navigation to it).
    return (
      <Navigate to={entry.current.closed ? `/case/${caseId}` : `/case/${caseId}/report`} replace />
    )
  }
  if (collectedCount === 0) {
    return <Navigate to={`/case/${caseId}`} replace />
  }

  /*
   * Responsive layout (the fixed sidebar takes 256px from lg up, so the content area is
   * viewport - 256px):
   *   < xl  (< 1280)   Page scrolls. Canvas first (60dvh, min 360px); tray + hypothesis below,
   *                    side by side from md, stacked on phones.
   *   xl    (>= 1280)  Two panes in a viewport-high frame: canvas | 20rem rail (tray over
   *                    hypothesis, the rail scrolls).
   *   2xl   (>= 1536)  The original three panes: tray | canvas | hypothesis. The rail wrapper
   *                    uses `display: contents` so its two children join the parent row.
   */
  return (
    <div className="flex flex-col xl:h-app-board">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gold-dark/30 bg-bureau-dark/80 px-4 py-2.5">
        <Link
          to={`/case/${caseId}`}
          className="type-label focus-ring touch-target inline-flex items-center gap-1 rounded-sm text-gold transition-colors hover:text-gold-light"
        >
          <ArrowLeft className="h-3 w-3" aria-hidden="true" />
          Case file
        </Link>
        <span className="type-label">{caseData.id}</span>
        <h1 className="type-title min-w-0 break-words text-gold">{caseData.title}</h1>
        <StatusBadge status={status} />
        <p className="type-meta basis-full text-off-white/60 2xl:basis-auto">
          Drag evidence to arrange · drag from a pin to another card to connect · select a string
          and press Delete to remove
        </p>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 xl:flex-row xl:overflow-hidden">
        <div className="h-board-canvas min-h-[360px] min-w-0 shrink-0 xl:h-auto xl:flex-1 2xl:order-2">
          <ErrorBoundary fallback={<StaticEvidenceList caseId={caseId} />}>
            <FlowCanvas caseId={caseId}>
              <BoardMinimap />
            </FlowCanvas>
          </ErrorBoundary>
        </div>
        <div className="flex min-w-0 flex-col gap-4 md:flex-row xl:w-80 xl:shrink-0 xl:flex-col xl:overflow-y-auto 2xl:contents">
          <div className="min-w-0 md:flex-1 xl:flex-none 2xl:order-1 2xl:w-72 2xl:shrink-0 2xl:overflow-y-auto">
            <BoardEvidenceTray caseId={caseId} />
          </div>
          <div className="min-w-0 md:flex-1 xl:flex-none 2xl:order-3 2xl:w-80 2xl:shrink-0 2xl:overflow-y-auto">
            <HypothesisPanel caseId={caseId} />
          </div>
        </div>
      </div>
    </div>
  )
}
