import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import HQPage from './HQPage'
import { useAppStore } from '@/store'
import { flushPendingWrite } from '@/store/middleware/persistenceMiddleware'
import { STORAGE_KEY } from '@/services/persistenceService'
import { CASES } from '@/data/cases'
import { CRYPTIDS } from '@/data/cryptids'
import { populateStore } from '@/test/populateStore'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return { ...actual, useReducedMotion: () => true }
})

describe('HQPage archive preview', () => {
  it('shows readable sealed labels and no cryptid names when nothing is unlocked', () => {
    useAppStore.setState({ unlockedCryptidIds: [] })
    const { container } = render(
      <MemoryRouter>
        <HQPage />
      </MemoryRouter>
    )
    expect(screen.getAllByText('UNIDENTIFIED SPECIMEN')).toHaveLength(3)
    expect(screen.getAllByText('SEALED ENTRY')).toHaveLength(2)
    for (const c of CRYPTIDS) expect(screen.queryByText(c.name)).not.toBeInTheDocument()
    expect(container.querySelector('.scan-hint')).toBeNull()
  })
})

describe('HQPage reset flow', () => {
  it('only resets after confirming in the modal', async () => {
    const user = userEvent.setup()
    populateStore()
    flushPendingWrite()
    render(
      <MemoryRouter>
        <HQPage />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: /reset all progress/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(useAppStore.getState().caseStatuses).toEqual({ 'case-001': 'in-progress' })
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()

    await user.click(screen.getByRole('button', { name: /reset all progress/i }))
    await user.click(screen.getByRole('button', { name: 'Purge Records' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const s = useAppStore.getState()
    expect(s.caseStatuses).toEqual({})
    expect(s.collectedEvidence).toEqual({})
    expect(s.unlockedCryptidIds).toEqual([])
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(screen.getAllByText(`0/${CASES.length}`).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('0/3').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('status')).toHaveTextContent('All investigation records purged.')
  })
})
