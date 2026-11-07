import { CheckCircle2, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import { CRYPTIDS } from '@/data/cryptids'
import { CASES } from '@/data/cases'
import { useCaseProgress } from '@/hooks/useCaseProgress'
import { useIdentification } from '@/hooks/useIdentification'
import Tooltip from '@/components/ui/Tooltip'
import Panel from '@/components/ui/Panel'
import Button from '@/components/ui/Button'
import CryptidSelector from './CryptidSelector'
import IdentificationResultOverlay from './IdentificationResultOverlay'

interface HypothesisPanelProps {
  caseId: string
}

const TOOLTIP_TEXT = 'Log at least 2 pieces of evidence and select a suspect before submitting.'

export default function HypothesisPanel({ caseId }: HypothesisPanelProps) {
  const { status, collectedCount } = useCaseProgress(caseId)
  const unlockedIds = useAppStore((s) => s.unlockedCryptidIds)
  const navigate = useNavigate()
  const {
    selectedCryptidId,
    setSelectedCryptidId,
    canSubmit,
    minimumRequired,
    submit,
    result,
    dismiss,
    fileReport,
  } = useIdentification(caseId)

  const handleFileReport = (): void => {
    const route = fileReport()
    if (route) navigate(route, { state: { justFiled: true } })
  }

  const correctId = CASES.find((c) => c.id === caseId)?.correctCryptidId
  const identifiedName = CRYPTIDS.find((c) => c.id === correctId)?.name ?? 'Unknown'

  let body
  if (status === 'closed') {
    body = (
      <p className="type-body-sm flex items-center gap-2 text-off-white/80">
        <Lock className="h-4 w-4 text-gold" aria-hidden="true" />
        Case closed. The hypothesis is sealed and read-only.
      </p>
    )
  } else if (status === 'identified') {
    body = (
      <div className="rounded-sm border border-forest-light/60 bg-forest-dark/30 p-3">
        <p className="type-heading flex items-center gap-2 text-off-white">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-forest-text" aria-hidden="true" />
          Identification confirmed: {identifiedName}
        </p>
        <p className="type-body-sm mt-2 text-off-white/70">The investigation report can now be filed.</p>
        <Button variant="primary" onClick={handleFileReport} className="mt-3 max-w-full">File Report</Button>
      </div>
    )
  } else {
    body = (
      <>
        <p className="type-label">
          {collectedCount} logged · minimum {minimumRequired}
        </p>
        <div className="mt-3">
          <CryptidSelector
            selectedId={selectedCryptidId}
            onSelect={setSelectedCryptidId}
            unlockedIds={unlockedIds}
          />
        </div>
        <div className="mt-4">
          {canSubmit ? (
            <Button variant="primary" onClick={submit}>Submit Investigation</Button>
          ) : (
            <Tooltip content={TOOLTIP_TEXT}>
              <span tabIndex={0} className="inline-block">
                <Button variant="primary" disabled>Submit Investigation</Button>
              </span>
            </Tooltip>
          )}
        </div>
      </>
    )
  }

  return (
    <Panel aria-label="Hypothesis" eyebrow="HYPOTHESIS FORM" reference="FORM H-7">
      <h2 className="type-heading text-gold">Form a Hypothesis</h2>
      <p className="type-body-sm mb-4 mt-1 text-off-white/70">
        Name the entity you believe is responsible, based on the evidence you have logged.
      </p>
      {body}
      <IdentificationResultOverlay result={result} onDismiss={dismiss} onFileReport={handleFileReport} />
    </Panel>
  )
}
