import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useAppStore } from '@/store'
import { CRYPTIDS } from '@/data/cryptids'
import ArchivePage from './ArchivePage'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return { ...actual, useReducedMotion: () => true }
})

function renderPage() {
  return render(
    <MemoryRouter>
      <ArchivePage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  useAppStore.setState({ unlockedCryptidIds: [], reports: {} })
})

describe('ArchivePage', () => {
  it('renders 5 locked entries with no cryptid names in the DOM', () => {
    const { container } = renderPage()
    expect(screen.getAllByLabelText('Locked dossier')).toHaveLength(5)
    for (const c of CRYPTIDS) {
      expect(container.textContent).not.toContain(c.name)
    }
    expect(screen.getByText(/0 of 3 identifiable entities discovered/)).toBeTruthy()
  })

  it('shows an unlocked entry and opens its dossier', () => {
    useAppStore.setState({ unlockedCryptidIds: ['cryptid-001'] })
    renderPage()
    expect(screen.getByText(/1 of 3 identifiable entities discovered/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Open dossier: The Warden' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog.textContent).toContain(CRYPTIDS[0].description)
    expect(dialog.textContent).toContain(CRYPTIDS[0].loreExcerpt)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('never reveals archive-only cryptids even if store is tampered', () => {
    useAppStore.setState({ unlockedCryptidIds: ['cryptid-004'] })
    const { container } = renderPage()
    expect(container.textContent).not.toContain('The Pale Cartographer')
    expect(screen.getAllByLabelText('Locked dossier')).toHaveLength(5)
  })
})
