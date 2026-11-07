import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EvidenceSlotGrid from './EvidenceSlotGrid'
import { useAppStore } from '@/store'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return { ...actual, useReducedMotion: () => true }
})

beforeEach(() => {
  useAppStore.setState({ collectedEvidence: {}, observationNotes: {}, caseStatuses: {} })
})

describe('EvidenceSlotGrid', () => {
  it('collects a locked slot exactly once on click', async () => {
    const user = userEvent.setup()
    render(<EvidenceSlotGrid caseId="case-001" />)
    await user.click(screen.getByRole('button', { name: 'Collect evidence: Broken Branches' }))
    expect(useAppStore.getState().collectedEvidence['case-001']).toEqual(['EV-001'])
    await user.click(screen.getByRole('button', { name: 'Examine evidence: Broken Branches' }))
    expect(useAppStore.getState().collectedEvidence['case-001']).toEqual(['EV-001'])
  })

  it('opens the evidence dialog without changing the store when a collected slot is clicked', async () => {
    const user = userEvent.setup()
    useAppStore.setState({ collectedEvidence: { 'case-001': ['EV-001'] } })
    render(<EvidenceSlotGrid caseId="case-001" />)
    await user.click(screen.getByRole('button', { name: 'Examine evidence: Broken Branches' }))
    expect(useAppStore.getState().collectedEvidence['case-001']).toEqual(['EV-001'])
    expect(screen.getByRole('dialog', { name: 'Broken Branches' })).toBeInTheDocument()
  })

  it('renders locked slots as a labelled sealed band with no bars or scan-hint', () => {
    const { container } = render(<EvidenceSlotGrid caseId="case-001" />)
    expect(screen.getAllByText('CONTENTS CLASSIFIED').length).toBeGreaterThan(0)
    expect(screen.queryAllByTestId('redaction-bar')).toHaveLength(0)
    expect(container.querySelector('.scan-hint')).toBeNull()
  })

  it('does not collect when the case is closed', async () => {
    const user = userEvent.setup()
    useAppStore.setState({ caseStatuses: { 'case-001': 'closed' } })
    render(<EvidenceSlotGrid caseId="case-001" />)
    await user.click(screen.getByRole('button', { name: 'Locked evidence: Broken Branches' }))
    expect(useAppStore.getState().collectedEvidence['case-001']).toBeUndefined()
  })
})
