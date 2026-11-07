/**
 * Structural accessibility checks (axe-style, no extra dependency) across every screen.
 * jsdom has no layout or CSS, so this covers semantics only: headings, landmarks, accessible
 * names, dialogs and the skip link. Contrast lives in contrast.test.ts.
 */
import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '@/store'
import { cancelPendingWrite } from '@/store/middleware/persistenceMiddleware'
import { clearEvidenceDrafts } from '@/components/features/case/EvidencePanel'
import { renderRoute, seedRichState, useJsdomRouterSupport } from '@/test/routerHarness'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return { ...actual, useReducedMotion: () => true }
})

const EMPTY_STATE = {
  caseStatuses: {},
  collectedEvidence: {},
  observationNotes: {},
  nodePositions: {},
  connections: {},
  unlockedCryptidIds: [],
  reports: {},
  lastIdentificationResult: null,
}

function headingLevels(): number[] {
  return Array.from(document.body.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((h) => Number(h.tagName.slice(1)))
}

/** The checks every screen (and every open dialog on it) must pass. */
function expectAccessibleStructure(): void {
  // Exactly one h1, and no skipped heading levels in document order.
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  const levels = headingLevels()
  expect(levels[0]).toBe(1)
  levels.forEach((level, i) => {
    if (i > 0) expect(level, `heading #${i + 1} (h${level}) follows h${levels[i - 1]}`).toBeLessThanOrEqual(levels[i - 1] + 1)
  })

  // One main landmark; every navigation landmark is named and the names are distinct.
  expect(screen.getAllByRole('main')).toHaveLength(1)
  const navNames = screen.getAllByRole('navigation').map((n) => n.getAttribute('aria-label') ?? '')
  navNames.forEach((name) => expect(name).not.toBe(''))
  expect(new Set(navNames).size).toBe(navNames.length)

  // Every interactive control has a non-empty accessible name.
  for (const role of ['button', 'link', 'radio', 'textbox'] as const) {
    for (const el of screen.queryAllByRole(role)) expect(el, `${role}: ${el.outerHTML.slice(0, 120)}`).toHaveAccessibleName()
  }
  for (const img of screen.queryAllByRole('img')) expect(img).toHaveAccessibleName()

  // Every dialog is named.
  for (const dialog of screen.queryAllByRole('dialog')) expect(dialog).toHaveAccessibleName()

  // Skip link targets the (single) main landmark.
  const skip = screen.getByRole('link', { name: 'Skip to main content' })
  expect(skip).toHaveAttribute('href', '#main-content')
  const target = document.getElementById('main-content')
  expect(target).not.toBeNull()
  expect(target?.tagName).toBe('MAIN')
}

describe('accessibility structure', () => {
  useJsdomRouterSupport()

  beforeEach(() => {
    cleanup()
    cancelPendingWrite()
    window.localStorage.clear()
    clearEvidenceDrafts()
    useAppStore.setState(EMPTY_STATE)
    seedRichState()
  })

  it('HQ', async () => {
    renderRoute('/')
    await screen.findByRole('heading', { level: 1, name: 'Bureau Headquarters' })
    expectAccessibleStructure()
  })

  it('HQ: reset confirmation dialog is named and labelled', async () => {
    renderRoute('/')
    await screen.findByRole('heading', { level: 1, name: 'Bureau Headquarters' })
    await userEvent.click(screen.getByRole('button', { name: /reset all progress/i }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAccessibleName('Purge all investigation records?')
    expect(dialog).toHaveAccessibleDescription(/cannot be undone/i)
    expectAccessibleStructure()
  })

  it('Orientation briefing dialog is named, described and keeps heading order valid', async () => {
    renderRoute('/')
    await screen.findByRole('heading', { level: 1, name: 'Bureau Headquarters' })
    await userEvent.click(screen.getByRole('button', { name: /field manual/i }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAccessibleName('Federal Bureau of Cryptid Investigation')
    expect(dialog).toHaveAccessibleDescription(/Bureau/)
    expect(within(dialog).getByRole('heading', { level: 2 })).toBeInTheDocument()
    expectAccessibleStructure()
  })

  it('Case detail (in progress) and its evidence panel dialog', async () => {
    renderRoute('/case/case-002')
    await screen.findByRole('heading', { level: 1, name: 'The Hollow Lake' })
    expectAccessibleStructure()

    const examine = screen.getAllByRole('button', { name: /^Examine evidence:/ })[0]
    await userEvent.click(examine)
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAccessibleName()
    expect(within(dialog).getByRole('button', { name: 'Close evidence panel' })).toBeInTheDocument()
    expect(within(dialog).getByRole('textbox', { name: 'Investigator observation' })).toBeInTheDocument()
    expectAccessibleStructure()
  })

  it('Case detail (closed, with filed report summary)', async () => {
    renderRoute('/case/case-001')
    await screen.findByRole('heading', { level: 1, name: 'The Forest Watcher' })
    expect(screen.getByRole('region', { name: 'Filed report summary' })).toBeInTheDocument()
    expectAccessibleStructure()
  })

  it('Investigation board, and its identification result dialog', async () => {
    renderRoute('/case/case-002/board')
    await screen.findByRole('heading', { level: 1, name: 'The Hollow Lake' })
    expectAccessibleStructure()

    // Pick a suspect and submit to open the result dialog.
    const radios = screen.getAllByRole('radio')
    await userEvent.click(radios[0])
    await userEvent.click(screen.getByRole('button', { name: 'Submit Investigation' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAccessibleName()
    expectAccessibleStructure()
  })

  it('Report', async () => {
    renderRoute('/case/case-001/report')
    await screen.findByRole('heading', { level: 1, name: 'Final Investigation Report' })
    expect(screen.getByRole('navigation', { name: 'Report navigation' })).toBeInTheDocument()
    expectAccessibleStructure()
  })

  it('Archive, and an opened dossier dialog', async () => {
    renderRoute('/archive')
    await screen.findByRole('heading', { level: 1, name: 'Cryptid Archive' })
    expectAccessibleStructure()

    await userEvent.click(screen.getByRole('button', { name: /^Open dossier:/ }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAccessibleName()
    expectAccessibleStructure()
  })

  it('the skip link moves focus to the main landmark without changing the route', async () => {
    const { router } = renderRoute('/archive')
    await screen.findByRole('heading', { level: 1, name: 'Cryptid Archive' })
    await userEvent.click(screen.getByRole('link', { name: 'Skip to main content' }))
    expect(screen.getByRole('main')).toHaveFocus()
    expect(router.state.location.pathname).toBe('/archive')
    expect(router.state.location.hash).toBe('')
  })
})
