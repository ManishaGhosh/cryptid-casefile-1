import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import IdentificationResultOverlay from './IdentificationResultOverlay'
import { runIdentification } from '@/services/identificationEngine'
import { CASES } from '@/data/cases'
import { CRYPTIDS } from '@/data/cryptids'
import { EVIDENCE } from '@/data/evidence'

// Motion enabled in this file (the sibling test file mocks reduced motion on).
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return { ...actual, useReducedMotion: () => false }
})

describe('IdentificationResultOverlay with motion enabled', () => {
  it('keeps the primary button usable and the ARIA value final while animating', () => {
    const result = runIdentification({
      caseData: CASES[0],
      submittedCryptidId: 'cryptid-001',
      collectedEvidenceIds: ['EV-001', 'EV-002', 'EV-003'],
      cryptids: CRYPTIDS,
      evidence: EVIDENCE,
    })
    render(<IdentificationResultOverlay result={result} onDismiss={() => {}} onFileReport={() => {}} />)
    const btn = screen.getByRole('button', { name: 'File Report' })
    expect(btn).toBeEnabled()
    expect(btn).toHaveFocus()
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '75')
  })
})
