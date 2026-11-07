/**
 * End-to-end play-through of all three cases through the REAL app (routes, pages, components,
 * store, persistence) driven with user-event and accessible queries.
 *
 * The only non-UI interactions:
 *  - React Flow's drag-to-connect needs real pointer geometry that jsdom lacks, so the board's
 *    connect path (useBoardSync.onConnect -> addConnection(makeConnection(..))) is invoked through
 *    the store for the one "add a connection" step.
 *  - The "refresh" is simulated (flush the debounced write, reset the store, hydrateStore, re-render).
 *    src/test/setup.ts clears LocalStorage after every test, so the refresh test first nudges the
 *    store to schedule a write of the in-memory progress, then flushes it.
 *
 * The tests in this file are sequential and share the in-memory store on purpose: later tests
 * (HQ totals, refresh, reset) build on the progress made by the case tests.
 */
import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { routes, routerFuture } from '@/router'
import { useAppStore } from '@/store'
import { hydrateStore } from '@/store/hydration'
import { cancelPendingWrite, flushPendingWrite } from '@/store/middleware/persistenceMiddleware'
import { clearEvidenceDrafts } from '@/components/features/case/EvidencePanel'
import { makeConnection } from '@/services/connectionRules'
import { computeMissingCategories } from '@/services/identificationEngine'
import { STORAGE_KEY } from '@/services/persistenceService'
import { ONBOARDING_KEY, clearOnboardingMemory } from '@/services/onboardingMemory'
import { resetOnboardingUi } from '@/hooks/useOnboarding'
import { BRIEFING_STEPS } from '@/data/onboarding'
import { CASES } from '@/data/cases'
import { CRYPTIDS } from '@/data/cryptids'
import { EVIDENCE } from '@/data/evidence'
import type { Case, Cryptid, EvidenceItem } from '@/types/domain'
import { installFlowTestEnv, uninstallFlowTestEnv } from './flowTestEnv'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return { ...actual, useReducedMotion: () => true }
})

beforeAll(() => {
  installFlowTestEnv()
  cancelPendingWrite()
  window.localStorage.clear()
  clearEvidenceDrafts()
  useAppStore.setState(DEFAULT_STATE)
})
afterAll(uninstallFlowTestEnv)

const DEFAULT_STATE = {
  caseStatuses: {},
  collectedEvidence: {},
  observationNotes: {},
  nodePositions: {},
  connections: {},
  unlockedCryptidIds: [],
  reports: {},
  lastIdentificationResult: null,
}

const TOTAL_EVIDENCE = EVIDENCE.length
const PLAYABLE = CRYPTIDS.filter((c) => c.mvpStatus === 'playable')
const PALE_CARTOGRAPHER = CRYPTIDS.find((c) => c.name === 'The Pale Cartographer')!
const ARCHIVE_ONLY_IDS = CRYPTIDS.filter((c) => c.mvpStatus === 'archive-only').map((c) => c.id)

/** Report text captured when each report was filed; compared after the simulated refresh. */
const reportTextBefore: Record<string, string> = {}

function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path], future: routerFuture })
  const view = render(<RouterProvider router={router} />)
  return { router, ...view }
}

function evidenceFor(caseData: Case): EvidenceItem[] {
  return caseData.evidenceIds.map((id) => EVIDENCE.find((e) => e.id === id)!)
}

function cryptidOf(caseData: Case): Cryptid {
  return CRYPTIDS.find((c) => c.id === caseData.correctCryptidId)!
}

/** Value text of an HQ stat tile ("Cases Closed3/3": label then value). */
function statTile(label: string): string {
  return screen.getByText(label).parentElement?.parentElement?.textContent ?? ''
}

async function useSidebar(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  const nav = screen.getByRole('navigation', { name: 'Bureau navigation' })
  await user.click(within(nav).getByRole('link', { name }))
}

async function selectSuspect(user: ReturnType<typeof userEvent.setup>, cryptid: Cryptid) {
  await user.click(screen.getByRole('radio', { name: new RegExp(`^${cryptid.name}`) }))
}

async function submitInvestigation(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Submit Investigation' }))
  return screen.findByRole('dialog')
}

describe('first visit', () => {
  it('auto-opens the Orientation Briefing, steps through all steps, and does not return after a refresh', async () => {
    clearOnboardingMemory()
    resetOnboardingUi()
    const user = userEvent.setup()
    const total = BRIEFING_STEPS.length
    expect(total).toBe(6)

    const app = renderApp('/')
    const dialog = await screen.findByRole('dialog', { name: BRIEFING_STEPS[0].title })
    expect(within(dialog).getByText(`Step 1 of ${total}`)).toBeInTheDocument()

    for (let i = 1; i < total; i++) {
      await user.click(within(dialog).getByRole('button', { name: 'Next' }))
      expect(await within(dialog).findByText(`Step ${i + 1} of ${total}`)).toBeInTheDocument()
      expect(within(dialog).getByRole('heading', { name: BRIEFING_STEPS[i].title })).toBeInTheDocument()
    }
    expect(within(dialog).queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Begin investigation' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(ONBOARDING_KEY) ?? '{}')).toMatchObject({ seen: true })

    // Simulated refresh: new page load, UI state reset, storage retained.
    app.unmount()
    cleanup()
    resetOnboardingUi()
    renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Bureau Headquarters' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe.each(CASES.map((c) => [c.id, c] as const))('%s end to end', (caseId, caseData) => {
  const cryptid = cryptidOf(caseData)
  const items = evidenceFor(caseData)
  const note = `Observation for ${caseId}: logged during the field review.`
  const total = caseData.evidenceIds.length

  it(
    'plays from HQ to a filed report and a new archive entry',
    async () => {
      const user = userEvent.setup()
      const unlockedBefore = [...useAppStore.getState().unlockedCryptidIds]

      // ── 1. Open from HQ via the case card ───────────────────────────────
      renderApp('/')
      const card = (await screen.findByRole('heading', { name: caseData.title, level: 3 })).closest('article')!
      await user.click(within(card).getByRole('link', { name: /open file/i }))

      expect(await screen.findByRole('heading', { name: caseData.title, level: 1 })).toBeInTheDocument()
      const incident = screen.getByRole('article', { name: 'Incident report' })
      expect(within(incident).getByText(caseData.narrative.slice(0, 40), { exact: false })).toBeInTheDocument()
      // No images exist in the repo: the field photograph slot shows the mount.
      expect(within(incident).getByText(/NOT ON FILE/)).toBeInTheDocument()
      const witnessSection = screen.getByRole('heading', { name: 'Witness Statements' }).closest('section')!
      expect(within(witnessSection).getAllByRole('listitem')).toHaveLength(caseData.witnessStatements.length)
      for (const w of caseData.witnessStatements) {
        expect(within(witnessSection).getByText(w.statement, { exact: false })).toBeInTheDocument()
      }
      expect(screen.getByText('IN PROGRESS')).toBeInTheDocument()

      // ── 2. Collect two items, save an observation note ──────────────────
      expect(screen.getByText(`0 / ${total} logged`)).toBeInTheDocument()
      for (let i = 0; i < 2; i++) {
        await user.click(screen.getByRole('button', { name: `Collect evidence: ${items[i].name}` }))
        expect(await screen.findByRole('button', { name: `Examine evidence: ${items[i].name}` })).toBeInTheDocument()
        expect(screen.getByText(`${i + 1} / ${total} logged`)).toBeInTheDocument()
      }
      await user.click(screen.getByRole('button', { name: `Examine evidence: ${items[0].name}` }))
      const panel = await screen.findByRole('dialog')
      await user.type(within(panel).getByLabelText('Investigator observation'), note)
      await user.click(within(panel).getByRole('button', { name: /log observation/i }))
      expect(await within(panel).findByText('Logged')).toBeInTheDocument()
      expect(useAppStore.getState().observationNotes[items[0].id]).toBe(note)
      await user.click(within(panel).getByRole('button', { name: 'Close evidence panel' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      // ── 3. Board: nodes render; wrong / archive-only / insufficient ─────
      await user.click(screen.getByRole('link', { name: /open investigation board/i }))
      expect(await screen.findByLabelText('Investigation board')).toBeInTheDocument()
      for (const i of [0, 1]) {
        expect(await screen.findByLabelText(`Evidence node: ${items[i].name}`)).toBeInTheDocument()
      }
      expect(screen.queryByLabelText(`Evidence node: ${items[2].name}`)).not.toBeInTheDocument()

      // Wrong playable suspect → INCONCLUSIVE, case still in progress, nothing unlocked.
      const wrong = PLAYABLE.find((c) => c.id !== cryptid.id)!
      await selectSuspect(user, wrong)
      let dialog = await submitInvestigation(user)
      expect(within(dialog).getByText('INCONCLUSIVE')).toBeInTheDocument()
      expect(useAppStore.getState().caseStatuses[caseId]).toBe('in-progress')
      expect(useAppStore.getState().unlockedCryptidIds).toEqual(unlockedBefore)
      await user.click(within(dialog).getByRole('button', { name: 'Revise hypothesis' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      // Archive-only suspect → INCONCLUSIVE and never unlocked.
      await selectSuspect(user, PALE_CARTOGRAPHER)
      dialog = await submitInvestigation(user)
      expect(within(dialog).getByText('INCONCLUSIVE')).toBeInTheDocument()
      expect(useAppStore.getState().caseStatuses[caseId]).toBe('in-progress')
      const unlockedNow = useAppStore.getState().unlockedCryptidIds
      expect(unlockedNow).toEqual(unlockedBefore)
      for (const id of ARCHIVE_ONLY_IDS) expect(unlockedNow).not.toContain(id)
      await user.click(within(dialog).getByRole('button', { name: 'Revise hypothesis' }))

      // Correct suspect with only 2 items → INSUFFICIENT EVIDENCE, categories but no names.
      await selectSuspect(user, cryptid)
      dialog = await submitInvestigation(user)
      expect(within(dialog).getByText('INSUFFICIENT EVIDENCE')).toBeInTheDocument()
      expect(within(dialog).getByText('Unexamined evidence categories')).toBeInTheDocument()
      const missing = computeMissingCategories(cryptid.associatedEvidenceIds, [items[0].id, items[1].id], EVIDENCE)
      expect(missing.length).toBeGreaterThan(0)
      for (const category of missing) {
        expect(within(dialog).getAllByText(category).length).toBeGreaterThan(0)
      }
      for (const uncollected of items.slice(2)) {
        expect(within(dialog).queryByText(new RegExp(uncollected.name, 'i'))).not.toBeInTheDocument()
      }
      expect(useAppStore.getState().unlockedCryptidIds).toEqual(unlockedBefore)
      await user.click(within(dialog).getByRole('button', { name: 'Continue investigating' }))

      // ── 4. Third item from the tray, one connection, correct → IDENTIFIED ─
      const tray = screen.getByRole('region', { name: 'Evidence tray' })
      expect(within(tray).getByText(`2 / ${total} logged`)).toBeInTheDocument()
      await user.click(within(tray).getByRole('button', { name: `Log ${items[2].id}` }))
      expect(await screen.findByLabelText(`Evidence node: ${items[2].name}`)).toBeInTheDocument()
      expect(within(tray).getByText(`3 / ${total} logged`)).toBeInTheDocument()

      act(() => {
        useAppStore.getState().addConnection(caseId, makeConnection(items[0].id, items[1].id))
      })
      expect(await screen.findByRole('button', { name: 'Remove connection' })).toBeInTheDocument()

      dialog = await submitInvestigation(user)
      expect(within(dialog).getByText('IDENTIFIED')).toBeInTheDocument()
      expect(within(dialog).getByRole('meter')).toHaveAttribute('aria-valuenow', '75')
      for (const item of items.slice(0, 3)) {
        const rationale = cryptid.evidenceRationale[item.id]
        expect(rationale).toBeTruthy()
        expect(within(dialog).getByText(rationale)).toBeInTheDocument()
      }
      expect(useAppStore.getState().unlockedCryptidIds).toEqual([...unlockedBefore, cryptid.id])

      await user.click(within(dialog).getByRole('button', { name: 'File Report' }))
      expect(await screen.findByRole('heading', { name: 'Final Investigation Report', level: 1 })).toBeInTheDocument()
      const report = screen.getByRole('article')
      expect(within(report).getAllByText(cryptid.name).length).toBeGreaterThan(0)
      expect(within(report).getByText(note)).toBeInTheDocument()
      expect(within(report).getByText('Connections drawn on the board: 1')).toBeInTheDocument()
      // Incident date exactly as stored: no invented year.
      const dateCell = within(report).getByText('INCIDENT DATE').nextElementSibling
      expect(dateCell?.textContent).toBe(caseData.incidentDate)
      expect(within(report).getByText(new RegExp(`^${caseData.incidentDate}$`, 'i'))).toBeInTheDocument()
      expect(useAppStore.getState().caseStatuses[caseId]).toBe('closed')
      reportTextBefore[caseId] = report.textContent ?? ''

      // ── 5. Archive ──────────────────────────────────────────────────────
      await useSidebar(user, /cryptid archive/i)
      expect(await screen.findByRole('heading', { name: 'Cryptid Archive' })).toBeInTheDocument()
      const identified = useAppStore.getState().unlockedCryptidIds
      expect(screen.getByRole('button', { name: `Open dossier: ${cryptid.name}` })).toBeInTheDocument()
      expect(
        screen.getByText(new RegExp(`${identified.length} of ${PLAYABLE.length} identifiable entities discovered`)),
      ).toBeInTheDocument()
      for (const c of CRYPTIDS) {
        if (!identified.includes(c.id)) {
          // Exact match: "The Hollow" is a prefix of the case title "The Hollow Lake" in the sidebar.
          expect(screen.queryByText(c.name)).not.toBeInTheDocument()
        }
      }

      // Back to HQ for the next case.
      await useSidebar(user, /bureau hq/i)
      expect(await screen.findByRole('heading', { name: 'Bureau Headquarters' })).toBeInTheDocument()
    },
    30000,
  )
})

describe('after all three cases', () => {
  it('shows 3/3 closed, full totals, and replays the Field Manual from the archive without navigating', async () => {
    const user = userEvent.setup()
    const app = renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Bureau Headquarters' })).toBeInTheDocument()
    expect(statTile('Cases Closed')).toBe(`Cases Closed${CASES.length}/${CASES.length}`)
    expect(statTile('Evidence Logged')).toBe(`Evidence Logged${CASES.length * 3}/${TOTAL_EVIDENCE}`)
    expect(screen.getByText(`${PLAYABLE.length} OF ${PLAYABLE.length} IDENTIFIABLE ENTITIES DISCOVERED`)).toBeInTheDocument()
    expect(screen.getByText(/All case files are closed\./)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /view file/i })).toHaveLength(CASES.length)
    expect(screen.queryByRole('link', { name: /open file/i })).not.toBeInTheDocument()

    await useSidebar(user, /cryptid archive/i)
    expect(await screen.findByRole('heading', { name: 'Cryptid Archive' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /field manual/i }))
    const dialog = await screen.findByRole('dialog', { name: BRIEFING_STEPS[0].title })
    expect(within(dialog).getByText(`Step 1 of ${BRIEFING_STEPS.length}`)).toBeInTheDocument()
    expect(app.router.state.location.pathname).toBe('/archive')
    await user.click(within(dialog).getByRole('button', { name: 'Skip briefing' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(app.router.state.location.pathname).toBe('/archive')
  })

  it('restores everything after a simulated refresh and reports match exactly', async () => {
    // setup.ts clears LocalStorage after each test: schedule a write of the in-memory progress.
    useAppStore.setState((s) => ({ caseStatuses: { ...s.caseStatuses } }))
    flushPendingWrite()
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull()

    cleanup()
    useAppStore.setState(DEFAULT_STATE)
    expect(useAppStore.getState().reports).toEqual({})
    expect(hydrateStore()).toBe('restored')

    const app = renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Bureau Headquarters' })).toBeInTheDocument()
    expect(statTile('Cases Closed')).toBe(`Cases Closed${CASES.length}/${CASES.length}`)
    expect(statTile('Evidence Logged')).toBe(`Evidence Logged${CASES.length * 3}/${TOTAL_EVIDENCE}`)
    expect(screen.getByText(`${PLAYABLE.length} OF ${PLAYABLE.length} IDENTIFIABLE ENTITIES DISCOVERED`)).toBeInTheDocument()
    expect(screen.getByText(/All case files are closed\./)).toBeInTheDocument()

    for (const c of CASES) {
      await act(async () => {
        await app.router.navigate(`/case/${c.id}/report`)
      })
      expect(await screen.findByRole('heading', { name: 'Final Investigation Report', level: 1 })).toBeInTheDocument()
      expect(screen.getByRole('article').textContent).toBe(reportTextBefore[c.id])
    }
  })

  it('Reset All Progress returns everything to new, removes the game key, and keeps the onboarding flag', async () => {
    const user = userEvent.setup()
    // Re-create the persisted key (cleared after the previous test) so removal is observable.
    useAppStore.setState((s) => ({ caseStatuses: { ...s.caseStatuses } }))
    flushPendingWrite()
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull()

    const view = renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Bureau Headquarters' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /reset all progress/i }))
    const modal = await screen.findByRole('dialog')
    await user.click(within(modal).getByRole('button', { name: 'Purge Records' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(statTile('Cases Closed')).toBe(`Cases Closed0/${CASES.length}`)
    expect(statTile('Evidence Logged')).toBe(`Evidence Logged0/${TOTAL_EVIDENCE}`)
    expect(screen.getByText(`0 OF ${PLAYABLE.length} IDENTIFIABLE ENTITIES DISCOVERED`)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /open file/i })).toHaveLength(CASES.length)
    expect(screen.queryByRole('link', { name: /view file/i })).not.toBeInTheDocument()
    expect(screen.getByText(/awaiting assignment/)).toBeInTheDocument()
    const state = useAppStore.getState()
    expect(state.caseStatuses).toEqual({})
    expect(state.collectedEvidence).toEqual({})
    expect(state.reports).toEqual({})
    expect(state.unlockedCryptidIds).toEqual([])
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(JSON.parse(window.localStorage.getItem(ONBOARDING_KEY) ?? '{}')).toMatchObject({ seen: true })

    // A fresh page load does not re-brief the investigator.
    view.unmount()
    cleanup()
    resetOnboardingUi()
    renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Bureau Headquarters' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
