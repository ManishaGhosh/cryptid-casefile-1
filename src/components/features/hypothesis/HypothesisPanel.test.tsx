import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import HypothesisPanel from './HypothesisPanel'
import { useAppStore } from '@/store'

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>()
  return { ...actual, useReducedMotion: () => true }
})

const CASE_ID = 'case-001'

function collect(ids: string[]) {
  useAppStore.setState({ collectedEvidence: { [CASE_ID]: ids }, caseStatuses: { [CASE_ID]: 'in-progress' } })
}

function renderPanel() {
  return render(
    <MemoryRouter>
      <HypothesisPanel caseId={CASE_ID} />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  useAppStore.setState({
    caseStatuses: {},
    collectedEvidence: {},
    unlockedCryptidIds: [],
    lastIdentificationResult: null,
    reports: {},
  })
})

describe('HypothesisPanel', () => {
  it('disables submit with 1 evidence and exposes the tooltip text', () => {
    collect(['EV-001'])
    renderPanel()
    expect(screen.getByRole('button', { name: 'Submit Investigation' })).toBeDisabled()
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent(
      'Log at least 2 pieces of evidence and select a suspect before submitting.',
    )
  })

  it('lists all five cryptids', () => {
    renderPanel()
    for (const name of ['The Warden', 'The Hollow', 'The Pale Cartographer', 'The Drowned Choir']) {
      expect(screen.getByRole('radio', { name: new RegExp(name) })).toBeInTheDocument()
    }
    expect(screen.getAllByRole('radio')).toHaveLength(5)
  })

  it('identifies The Warden with 3 items', async () => {
    collect(['EV-001', 'EV-002', 'EV-003'])
    renderPanel()
    await userEvent.click(screen.getByRole('radio', { name: /The Warden/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Submit Investigation' }))
    const s = useAppStore.getState()
    expect(s.caseStatuses[CASE_ID]).toBe('identified')
    expect(s.unlockedCryptidIds).toContain('cryptid-001')
    expect(s.lastIdentificationResult?.outcome).toBe('success')
  })

  it('files a report, closes the case and navigates to the report route', async () => {
    collect(['EV-001', 'EV-002', 'EV-003'])
    render(
      <MemoryRouter initialEntries={['/case/case-001']}>
        <Routes>
          <Route path="/case/:caseId" element={<HypothesisPanel caseId={CASE_ID} />} />
          <Route path="/case/:caseId/report" element={<div>REPORT ROUTE</div>} />
        </Routes>
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole('radio', { name: /The Warden/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Submit Investigation' }))
    const dialog = screen.getByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'File Report' }))
    const s = useAppStore.getState()
    expect(s.reports[CASE_ID]?.identifiedCryptidId).toBe('cryptid-001')
    expect(s.caseStatuses[CASE_ID]).toBe('closed')
    expect(screen.getByText('REPORT ROUTE')).toBeInTheDocument()
  })

  it('is inconclusive for the wrong cryptid', async () => {
    collect(['EV-001', 'EV-002', 'EV-003', 'EV-004'])
    renderPanel()
    await userEvent.click(screen.getByRole('radio', { name: /The Hollow/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Submit Investigation' }))
    const s = useAppStore.getState()
    expect(s.lastIdentificationResult?.outcome).toBe('inconclusive')
    expect(s.caseStatuses[CASE_ID]).toBe('in-progress')
    expect(s.unlockedCryptidIds).toEqual([])
  })

  it('reports insufficient evidence with 2 items', async () => {
    collect(['EV-001', 'EV-002'])
    renderPanel()
    await userEvent.click(screen.getByRole('radio', { name: /The Warden/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Submit Investigation' }))
    const s = useAppStore.getState()
    expect(s.lastIdentificationResult?.outcome).toBe('insufficient-evidence')
    expect(s.caseStatuses[CASE_ID]).toBe('in-progress')
  })

  it('enables submit with 2+ evidence once a suspect is selected', async () => {
    collect(['EV-001', 'EV-002'])
    renderPanel()
    expect(screen.getByRole('button', { name: 'Submit Investigation' })).toBeDisabled()
    await userEvent.click(screen.getByRole('radio', { name: /The Hollow/ }))
    expect(screen.getByRole('button', { name: 'Submit Investigation' })).toBeEnabled()
  })

  it('supports a keyboard-only flow: Tab to the radio group, arrow-select, Tab to Submit, Enter', async () => {
    const user = userEvent.setup()
    collect(['EV-001', 'EV-002', 'EV-003'])
    renderPanel()
    await user.tab()
    const radios = screen.getAllByRole('radio')
    expect(radios[0]).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(radios[1]).toHaveFocus()
    expect(radios[1]).toBeChecked()
    await user.tab()
    const submit = screen.getByRole('button', { name: 'Submit Investigation' })
    expect(submit).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(useAppStore.getState().lastIdentificationResult?.submittedCryptidId).toBe(
      radios[1].getAttribute('value'),
    )
  })

  it('shows the tooltip when the disabled submit wrapper receives keyboard focus', async () => {
    const user = userEvent.setup()
    collect(['EV-001'])
    renderPanel()
    const tooltip = screen.getByRole('tooltip', { hidden: true })
    expect(tooltip).toHaveClass('hidden')
    // Radios come first in tab order; the focusable wrapper around the disabled button is last.
    for (let i = 0; i < 2; i++) await user.tab()
    const wrapper = screen.getByRole('button', { name: 'Submit Investigation' }).parentElement as HTMLElement
    expect(wrapper).toHaveFocus()
    expect(wrapper).toHaveAttribute('aria-describedby', tooltip.id)
    expect(tooltip).not.toHaveClass('hidden')
    await user.keyboard('{Escape}')
    expect(tooltip).toHaveClass('hidden')
  })

  it('shows a confirmed card with File Report when identified, and files the report', async () => {
    useAppStore.setState({
      collectedEvidence: { [CASE_ID]: ['EV-001', 'EV-002', 'EV-003'] },
      caseStatuses: { [CASE_ID]: 'identified' },
    })
    renderPanel()
    expect(screen.getByText(/Identification confirmed: The Warden/)).toBeInTheDocument()
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
    expect(screen.queryByRole('button', { name: 'Submit Investigation' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'File Report' }))
    expect(useAppStore.getState().caseStatuses[CASE_ID]).toBe('closed')
    expect(useAppStore.getState().reports[CASE_ID]).toBeDefined()
  })

  it('is read-only when the case is closed', () => {
    useAppStore.setState({
      collectedEvidence: { [CASE_ID]: ['EV-001', 'EV-002', 'EV-003'] },
      caseStatuses: { [CASE_ID]: 'closed' },
    })
    renderPanel()
    expect(screen.getByText(/Case closed\. The hypothesis is sealed and read-only\./)).toBeInTheDocument()
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
    expect(screen.queryByRole('button', { name: 'Submit Investigation' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'File Report' })).not.toBeInTheDocument()
  })

  it('never unlocks an archive-only cryptid', async () => {
    collect(['EV-001', 'EV-002', 'EV-003'])
    renderPanel()
    await userEvent.click(screen.getByRole('radio', { name: /The Pale Cartographer/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Submit Investigation' }))
    const s = useAppStore.getState()
    expect(s.unlockedCryptidIds).toEqual([])
    expect(s.lastIdentificationResult?.outcome).toBe('inconclusive')
  })
})
