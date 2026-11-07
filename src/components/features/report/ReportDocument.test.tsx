import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import ReportDocument from './ReportDocument'
import { makeReport } from '@/test/reportFixture'

describe('ReportDocument', () => {
  it('renders the stored report contents', () => {
    const report = makeReport()
    render(
      <MemoryRouter>
        <ReportDocument report={report} />
      </MemoryRouter>,
    )
    expect(screen.getByText(report.caseTitle)).toBeInTheDocument()
    expect(screen.getAllByText(report.identifiedCryptidName).length).toBeGreaterThan(0)
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '75')
    expect(screen.getAllByText(/^EXHIBIT [A-C]$/)).toHaveLength(3)
    for (const entry of report.collectedEvidence) {
      expect(entry.rationale.length).toBeGreaterThan(0)
      expect(screen.getByText(entry.rationale, { exact: false })).toBeInTheDocument()
    }
    expect(screen.getByText('Bark was peeled in a clean spiral.')).toBeInTheDocument()
    expect(screen.getAllByText(/No observation recorded/)).toHaveLength(2)
    expect(screen.getByText('Same direction of travel')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /archive/i })).toHaveAttribute('href', '/archive')
  })

  it('shows the incident date as stored, without inventing a year', () => {
    const report = makeReport()
    expect(report.incidentDate).toBe('October 14')
    render(
      <MemoryRouter>
        <ReportDocument report={report} />
      </MemoryRouter>,
    )
    expect(screen.getByText(/^October 14$/i)).toBeInTheDocument()
    expect(screen.queryByText(/\b2001\b/)).not.toBeInTheDocument()
    expect(screen.queryByText(/14 OCT 2001/)).not.toBeInTheDocument()
  })
})
