import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import InvestigationBoardPage from './InvestigationBoardPage'
import { useAppStore } from '@/store'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return { ...actual, useReducedMotion: () => true }
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/case/case-001/board']}>
      <Routes>
        <Route path="/case/:caseId/board" element={<InvestigationBoardPage />} />
        <Route path="/case/:caseId" element={<div>CASE DETAIL MARKER</div>} />
        <Route path="/case/:caseId/report" element={<div>REPORT MARKER</div>} />
        <Route path="/" element={<div>HQ MARKER</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  useAppStore.setState({ collectedEvidence: {}, caseStatuses: {}, observationNotes: {} })
})

describe('InvestigationBoardPage', () => {
  it('redirects to case detail when no evidence is collected', () => {
    renderPage()
    expect(screen.getByText('CASE DETAIL MARKER')).toBeInTheDocument()
  })

  it('redirects to case detail when the case is closed', () => {
    useAppStore.setState({
      collectedEvidence: { 'case-001': ['EV-001'] },
      caseStatuses: { 'case-001': 'closed' },
    })
    renderPage()
    expect(screen.getByText('CASE DETAIL MARKER')).toBeInTheDocument()
  })

  it('renders the board and tray when evidence is collected', () => {
    useAppStore.setState({
      collectedEvidence: { 'case-001': ['EV-001'] },
      caseStatuses: { 'case-001': 'in-progress' },
    })
    renderPage()
    expect(screen.getByLabelText('Investigation board')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Evidence tray' })).toBeInTheDocument()
    expect(screen.getByText('1 / 4 logged')).toBeInTheDocument()
  })

  it('goes to the report (not the case file) when the case closes while on the board', () => {
    useAppStore.setState({
      collectedEvidence: { 'case-001': ['EV-001'] },
      caseStatuses: { 'case-001': 'identified' },
    })
    renderPage()
    act(() => {
      useAppStore.setState({ caseStatuses: { 'case-001': 'closed' } })
    })
    expect(screen.getByText('REPORT MARKER')).toBeInTheDocument()
  })

  it('collects an uncollected item from the tray', async () => {
    useAppStore.setState({
      collectedEvidence: { 'case-001': ['EV-001'] },
      caseStatuses: { 'case-001': 'in-progress' },
    })
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Log EV-002' }))
    expect(useAppStore.getState().collectedEvidence['case-001']).toContain('EV-002')
  })
})
