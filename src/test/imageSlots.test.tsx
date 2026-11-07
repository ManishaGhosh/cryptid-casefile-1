/**
 * Spoiler safety (IMG-004) and slot wiring: locked or sealed items never render an <img>
 * (so no network request), and unlocked or collected items do.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DossierDetail from '@/components/features/archive/DossierDetail'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CryptidEntry from '@/components/features/archive/CryptidEntry'
import EvidenceSlotGrid from '@/components/features/case/EvidenceSlotGrid'
import { CRYPTIDS } from '@/data/cryptids'
import { useAppStore } from '@/store'
import { renderRoute, seedRichState, useJsdomRouterSupport } from '@/test/routerHarness'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return { ...actual, useReducedMotion: () => true }
})

const playable = CRYPTIDS.find((c) => c.id === 'cryptid-001')!
const archiveOnly = CRYPTIDS.find((c) => c.mvpStatus === 'archive-only')!

afterEach(cleanup)

describe('image slots are spoiler-safe', () => {
  useJsdomRouterSupport()

  beforeEach(() => {
    useAppStore.setState({ collectedEvidence: {}, observationNotes: {}, caseStatuses: {} })
  })

  it('renders no <img> for locked evidence slots', () => {
    const { container } = render(<EvidenceSlotGrid caseId="case-001" />)
    expect(container.querySelectorAll('img')).toHaveLength(0)
  })

  it('renders only the collected evidence photo, not the locked ones', () => {
    useAppStore.setState({ collectedEvidence: { 'case-001': ['EV-001'] } })
    const { container } = render(<EvidenceSlotGrid caseId="case-001" />)
    const imgs = container.querySelectorAll('img')
    expect(imgs).toHaveLength(1)
    expect(screen.getByAltText('Evidence photograph: Broken Branches')).toBeInTheDocument()
  })

  it('renders the specimen plate for an unlocked cryptid card', () => {
    render(<CryptidEntry entry={{ cryptid: playable, unlocked: true, sealed: false }} onOpen={() => {}} />)
    expect(screen.getByAltText('Specimen plate: The Warden')).toBeInTheDocument()
  })

  it('renders no <img> for locked (pending) or sealed cryptid cards', () => {
    const pending = render(<CryptidEntry entry={{ cryptid: playable, unlocked: false, sealed: false }} onOpen={() => {}} />)
    expect(pending.container.querySelectorAll('img')).toHaveLength(0)
    pending.unmount()
    const sealed = render(<CryptidEntry entry={{ cryptid: archiveOnly, unlocked: false, sealed: true }} onOpen={() => {}} />)
    expect(sealed.container.querySelectorAll('img')).toHaveLength(0)
  })

  it('renders no evidence or cryptid images in the HQ archive preview', async () => {
    seedRichState()
    const { container } = renderRoute('/')
    await screen.findByRole('heading', { level: 1, name: 'Bureau Headquarters' })
    expect(container.querySelectorAll('img[src*="/images/cryptids/"], img[src*="/images/evidence/"]')).toHaveLength(0)
  })
})

describe('cryptid plate reshapes only after the image loads', () => {
  it('archive card plate switches from the strip to a 4:3 crop on load', () => {
    const { container } = render(
      <CryptidEntry entry={{ cryptid: playable, unlocked: true, sealed: false }} onOpen={() => {}} />,
    )
    const plate = container.querySelector('[data-plate-shape]')!
    expect(plate).toHaveClass('h-28')
    expect(plate).not.toHaveClass('aspect-[4/3]')
    fireEvent.load(screen.getByAltText('Specimen plate: The Warden'))
    expect(plate).toHaveClass('aspect-[4/3]')
    expect(plate).not.toHaveClass('h-28')
  })

  const renderDossier = () =>
    render(
      <MemoryRouter>
        <DossierDetail
          entry={{ cryptid: playable, unlocked: true, sealed: false, linkedCaseId: null, reportFiledAt: null } as never}
          onClose={() => {}}
        />
      </MemoryRouter>,
    )
  const band = () => document.querySelector('.plate.h-16')

  it('dossier shows the thin band until the portrait loads, then swaps to the portrait', () => {
    renderDossier()
    expect(band()).not.toBeNull()
    expect(document.querySelector('[data-image-state="loading"]')?.querySelector('.h-0')).not.toBeNull()
    fireEvent.load(screen.getByAltText('Specimen plate: The Warden'))
    expect(band()).toBeNull()
    expect(document.querySelector('[data-image-state="loaded"]')).toHaveClass('plate')
  })

  it('dossier keeps the band and renders no <img> when the image fails', () => {
    renderDossier()
    fireEvent.error(screen.getByAltText('Specimen plate: The Warden'))
    expect(band()).not.toBeNull()
    expect(document.querySelectorAll('img')).toHaveLength(0)
  })
})
