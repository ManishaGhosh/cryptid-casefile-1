import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import IdentificationResultOverlay from './IdentificationResultOverlay'
import ConfidenceMeter from './ConfidenceMeter'
import { runIdentification } from '@/services/identificationEngine'
import { CASES } from '@/data/cases'
import { CRYPTIDS } from '@/data/cryptids'
import { EVIDENCE } from '@/data/evidence'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return { ...actual, useReducedMotion: () => true }
})

const caseData = CASES[0]
const warden = CRYPTIDS.find((c) => c.id === 'cryptid-001')!

function identify(cryptidId: string, evidenceIds: string[]) {
  return runIdentification({
    caseData,
    submittedCryptidId: cryptidId,
    collectedEvidenceIds: evidenceIds,
    cryptids: CRYPTIDS,
    evidence: EVIDENCE,
  })
}

describe('IdentificationResultOverlay', () => {
  it('renders nothing for a null result', () => {
    const { container } = render(<IdentificationResultOverlay result={null} onDismiss={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows success stamp, 75 score, supporting rationale and fires onFileReport', () => {
    const onFileReport = vi.fn()
    const result = identify('cryptid-001', ['EV-001', 'EV-002', 'EV-003'])
    render(<IdentificationResultOverlay result={result} onDismiss={() => {}} onFileReport={onFileReport} />)
    expect(screen.getByText('IDENTIFIED')).toBeInTheDocument()
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '75')
    for (const id of ['EV-001', 'EV-002', 'EV-003']) {
      expect(screen.getByText(warden.evidenceRationale[id])).toBeInTheDocument()
    }
    fireEvent.click(screen.getByRole('button', { name: 'File Report' }))
    expect(onFileReport).toHaveBeenCalledTimes(1)
  })

  it('inconclusive explains the verdict is hypothesis-based and hides the correct cryptid', () => {
    const result = identify('cryptid-002', ['EV-001', 'EV-002', 'EV-003'])
    const { container } = render(<IdentificationResultOverlay result={result} onDismiss={() => {}} />)
    expect(screen.getByText('INCONCLUSIVE')).toBeInTheDocument()
    expect(
      screen.getByText('This verdict is based on your hypothesis, not the confidence score.'),
    ).toBeInTheDocument()
    expect(container.textContent).not.toContain(warden.name)
  })

  it('insufficient-evidence lists missing categories but not uncollected evidence names', () => {
    const result = identify('cryptid-001', ['EV-001', 'EV-002'])
    const { container } = render(<IdentificationResultOverlay result={result} onDismiss={() => {}} />)
    expect(screen.getByText('INSUFFICIENT EVIDENCE')).toBeInTheDocument()
    expect(result.missingCategories.length).toBeGreaterThan(0)
    for (const c of result.missingCategories) {
      expect(screen.getAllByText(c).length).toBeGreaterThan(0)
    }
    for (const id of ['EV-003', 'EV-004']) {
      const name = EVIDENCE.find((e) => e.id === id)!.name
      expect(container.textContent).not.toContain(name)
    }
  })

  it('calls onDismiss on Escape', () => {
    const onDismiss = vi.fn()
    const result = identify('cryptid-001', ['EV-001'])
    render(<IdentificationResultOverlay result={result} onDismiss={onDismiss} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})

describe('ConfidenceMeter', () => {
  it('exposes aria-valuenow', () => {
    render(<ConfidenceMeter score={50} />)
    const meter = screen.getByRole('meter')
    expect(meter).toHaveAttribute('aria-valuenow', '50')
    expect(meter).toHaveAttribute('aria-valuemin', '0')
    expect(meter).toHaveAttribute('aria-valuemax', '100')
  })
})
