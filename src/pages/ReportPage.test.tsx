import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import ReportPage from './ReportPage'
import { makeReport } from '@/test/reportFixture'
import { useAppStore } from '@/store'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/case/case-001/report']}>
      <Routes>
        <Route path="/case/:caseId/report" element={<ReportPage />} />
        <Route path="/case/:caseId" element={<div>CASE DETAIL MARKER</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  useAppStore.setState({ reports: {}, collectedEvidence: {} })
})

describe('ReportPage', () => {
  it('redirects to case detail when no report exists', () => {
    renderPage()
    expect(screen.getByText('CASE DETAIL MARKER')).toBeInTheDocument()
  })

  it('renders the stored report', () => {
    useAppStore.setState({ reports: { 'case-001': makeReport() } })
    renderPage()
    expect(screen.getByRole('heading', { name: 'Final Investigation Report' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Case file/ })).toHaveAttribute('href', '/case/case-001')
  })

  it('plays the filed entrance only with justFiled router state', () => {
    useAppStore.setState({ reports: { 'case-001': makeReport() } })
    const { container, unmount } = render(
      <MemoryRouter initialEntries={[{ pathname: '/case/case-001/report', state: { justFiled: true } }]}>
        <Routes>
          <Route path="/case/:caseId/report" element={<ReportPage />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(container.querySelector('[data-entrance]')).toHaveAttribute('data-entrance', 'filed')
    unmount()
    const again = renderPage()
    expect(again.container.querySelector('[data-entrance]')).toHaveAttribute('data-entrance', 'static')
  })

  it('shows the filed snapshot even if collected evidence changes afterwards', () => {
    useAppStore.setState({ reports: { 'case-001': makeReport() } })
    useAppStore.setState({ collectedEvidence: { 'case-001': ['EV-001'] } })
    renderPage()
    expect(screen.getAllByText(/^EXHIBIT [A-C]$/)).toHaveLength(3)
  })
})
