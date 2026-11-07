import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import EvidencePanel, { clearEvidenceDrafts } from './EvidencePanel'
import { useAppStore } from '@/store'
import type { EvidenceItem } from '@/types/domain'

const evidence: EvidenceItem = {
  id: 'ev-test-1',
  caseId: 'case-test',
  name: 'Plaster Cast',
  description: 'A cast of a large footprint.',
  category: 'physical',
}

function Harness() {
  const [open, setOpen] = useState<EvidenceItem | null>(evidence)
  return (
    <>
      <button onClick={() => setOpen(evidence)}>reopen</button>
      <EvidencePanel evidence={open} onClose={() => setOpen(null)} />
    </>
  )
}

beforeEach(() => {
  clearEvidenceDrafts()
  useAppStore.setState({ observationNotes: {} })
})

describe('EvidencePanel', () => {
  it('renders name and description', () => {
    render(<EvidencePanel evidence={evidence} onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: 'Plaster Cast' })).toBeInTheDocument()
    expect(screen.getByText('A cast of a large footprint.')).toBeInTheDocument()
  })

  it('renders nothing when evidence is null', () => {
    const { container } = render(<EvidencePanel evidence={null} onClose={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('stores the note in the store on Log Observation', async () => {
    const user = userEvent.setup()
    render(<EvidencePanel evidence={evidence} onClose={() => {}} />)
    await user.type(screen.getByLabelText('Investigator observation'), 'Deep impression')
    await user.click(screen.getByRole('button', { name: /log observation/i }))
    expect(useAppStore.getState().observationNotes[evidence.id]).toBe('Deep impression')
    expect(screen.getByText('Logged')).toBeInTheDocument()
  })

  it('restores an unsaved draft after close and reopen', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByLabelText('Investigator observation'), 'unsaved text')
    await user.click(screen.getByRole('button', { name: 'Close evidence panel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'reopen' }))
    expect(screen.getByLabelText('Investigator observation')).toHaveValue('unsaved text')
    expect(useAppStore.getState().observationNotes[evidence.id]).toBeUndefined()
  })
})
