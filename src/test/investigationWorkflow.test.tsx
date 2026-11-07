import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { routes, routerFuture } from '@/router'
import { useAppStore } from '@/store'
import { hydrateStore } from '@/store/hydration'
import { cancelPendingWrite, flushPendingWrite } from '@/store/middleware/persistenceMiddleware'
import { clearEvidenceDrafts } from '@/components/features/case/EvidencePanel'
import { makeConnection } from '@/services/connectionRules'
import { CASES } from '@/data/cases'
import { CRYPTIDS } from '@/data/cryptids'
import { installFlowTestEnv, uninstallFlowTestEnv } from './flowTestEnv'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return { ...actual, useReducedMotion: () => true }
})

beforeAll(installFlowTestEnv)
afterAll(uninstallFlowTestEnv)

const CASE_ID = 'case-001'
const NOTE = 'Branch breaks are all at the same height.'

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

function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path], future: routerFuture })
  const view = render(<RouterProvider router={router} />)
  return { router, ...view }
}

beforeEach(() => {
  cancelPendingWrite()
  window.localStorage.clear()
  clearEvidenceDrafts()
  useAppStore.setState(DEFAULT_STATE)
})

describe('complete investigation workflow (case-001)', () => {
  it(
    'plays Case 001 from HQ to a filed report and survives a simulated refresh',
    async () => {
      const user = userEvent.setup()
      const caseData = CASES.find((c) => c.id === CASE_ID)!
      const warden = CRYPTIDS.find((c) => c.id === caseData.correctCryptidId)!
      expect(warden.name).toBe('The Warden')

      // â”€â”€ 1. HQ â†’ open Case 001 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const app = renderApp('/')
      expect(await screen.findByRole('heading', { name: 'Bureau Headquarters' })).toBeInTheDocument()
      const openLinks = screen.getAllByRole('link', { name: /open file/i })
      expect(openLinks).toHaveLength(3)
      await user.click(openLinks[0])

      expect(await screen.findByRole('heading', { name: caseData.title, level: 1 })).toBeInTheDocument()
      const incident = screen.getByRole('article', { name: 'Incident report' })
      expect(within(incident).getByText(caseData.narrative.slice(0, 40), { exact: false })).toBeInTheDocument()
      const witnessSection = screen.getByRole('heading', { name: 'Witness Statements' }).closest('section')!
      expect(within(witnessSection).getAllByRole('listitem')).toHaveLength(caseData.witnessStatements.length)
      expect(screen.getByText('IN PROGRESS')).toBeInTheDocument()
      expect(useAppStore.getState().caseStatuses[CASE_ID]).toBe('in-progress')

      // â”€â”€ 2. Collect EV-001 and EV-002, write an observation note â”€â”€â”€â”€â”€â”€â”€â”€â”€
      expect(screen.getByText('0 / 4 logged')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Collect evidence: Broken Branches' }))
      expect(await screen.findByRole('button', { name: 'Examine evidence: Broken Branches' })).toBeInTheDocument()
      expect(screen.getByText('1 / 4 logged')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Collect evidence: Thermal Anomaly' }))
      expect(await screen.findByRole('button', { name: 'Examine evidence: Thermal Anomaly' })).toBeInTheDocument()
      expect(screen.getByText('2 / 4 logged')).toBeInTheDocument()
      // Uncollected slots remain locked.
      expect(screen.getByRole('button', { name: 'Collect evidence: Missing Deer' })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Examine evidence: Broken Branches' }))
      const panel = await screen.findByRole('dialog')
      await user.type(within(panel).getByLabelText('Investigator observation'), NOTE)
      await user.click(within(panel).getByRole('button', { name: /log observation/i }))
      expect(await within(panel).findByText('Logged')).toBeInTheDocument()
      expect(useAppStore.getState().observationNotes['EV-001']).toBe(NOTE)
      await user.click(within(panel).getByRole('button', { name: 'Close evidence panel' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      // â”€â”€ 3. Board: nodes render for the two collected items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      await user.click(screen.getByRole('link', { name: /open investigation board/i }))
      expect(await screen.findByLabelText('Investigation board')).toBeInTheDocument()
      expect(await screen.findByLabelText('Evidence node: Broken Branches')).toBeInTheDocument()
      expect(await screen.findByLabelText('Evidence node: Thermal Anomaly')).toBeInTheDocument()
      expect(screen.queryByLabelText('Evidence node: Missing Deer')).not.toBeInTheDocument()

      // â”€â”€ 5a. Wrong suspect (The Hollow) â†’ INCONCLUSIVE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      await user.click(screen.getByRole('radio', { name: /The Hollow/ }))
      await user.click(screen.getByRole('button', { name: 'Submit Investigation' }))
      let dialog = await screen.findByRole('dialog')
      expect(within(dialog).getByText('INCONCLUSIVE')).toBeInTheDocument()
      expect(within(dialog).getByText('Case analysis')).toBeInTheDocument()
      await user.click(within(dialog).getByRole('button', { name: 'Revise hypothesis' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      // â”€â”€ 5b. Right suspect, only 2 of 3 required â†’ INSUFFICIENT EVIDENCE â”€
      await user.click(screen.getByRole('radio', { name: /The Warden/ }))
      await user.click(screen.getByRole('button', { name: 'Submit Investigation' }))
      dialog = await screen.findByRole('dialog')
      expect(within(dialog).getByText('INSUFFICIENT EVIDENCE')).toBeInTheDocument()
      expect(within(dialog).getByText('Unexamined evidence categories')).toBeInTheDocument()
      expect(within(dialog).getByText('Biological')).toBeInTheDocument()
      // Uncollected evidence names must not be leaked.
      expect(within(dialog).queryByText(/Missing Deer/)).not.toBeInTheDocument()
      expect(within(dialog).queryByText(/Resin Markings/)).not.toBeInTheDocument()
      await user.click(within(dialog).getByRole('button', { name: 'Continue investigating' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      // â”€â”€ 3b. Log a third item from the board's evidence tray â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const tray = screen.getByRole('region', { name: 'Evidence tray' })
      expect(within(tray).getByText('2 / 4 logged')).toBeInTheDocument()
      await user.click(within(tray).getByRole('button', { name: 'Log EV-003' }))
      expect(await screen.findByLabelText('Evidence node: Missing Deer')).toBeInTheDocument()
      expect(within(tray).getByText('3 / 4 logged')).toBeInTheDocument()

      // â”€â”€ 4. Connection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      // EXCEPTION: React Flow's drag-to-connect needs real layout/pointer geometry that jsdom
      // does not provide, so the board's connect path (useBoardSync.onConnect â†’ addConnection
      // with makeConnection) is invoked through the store for this one step.
      act(() => {
        useAppStore.getState().addConnection(CASE_ID, makeConnection('EV-001', 'EV-002'))
      })
      expect(useAppStore.getState().connections[CASE_ID]).toHaveLength(1)
      expect(await screen.findByRole('button', { name: 'Remove connection' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Add connection note' })).toBeInTheDocument()

      // â”€â”€ 6. Right suspect with 3 items â†’ IDENTIFIED, file the report â”€â”€â”€â”€â”€
      await user.click(screen.getByRole('button', { name: 'Submit Investigation' }))
      dialog = await screen.findByRole('dialog')
      expect(within(dialog).getByText('IDENTIFIED')).toBeInTheDocument()
      expect(within(dialog).getByRole('meter')).toHaveAttribute('aria-valuenow', '75')
      for (const id of ['EV-001', 'EV-002', 'EV-003']) {
        const rationale = warden.evidenceRationale[id]
        expect(rationale).toBeTruthy()
        expect(within(dialog).getByText(rationale)).toBeInTheDocument()
      }
      expect(useAppStore.getState().unlockedCryptidIds).toEqual([warden.id])

      await user.click(within(dialog).getByRole('button', { name: 'File Report' }))
      expect(
        await screen.findByRole('heading', { name: 'Final Investigation Report', level: 1 }),
      ).toBeInTheDocument()
      expect(app.router.state.location.pathname).toBe(`/case/${CASE_ID}/report`)
      const reportArticle = screen.getByRole('article')
      expect(within(reportArticle).getAllByText('The Warden').length).toBeGreaterThan(0)
      expect(within(reportArticle).getByText(NOTE)).toBeInTheDocument()
      expect(within(reportArticle).getByText('Connections drawn on the board: 1')).toBeInTheDocument()
      // Incident date shown as stored, no invented year.
      expect(within(reportArticle).getByText(/^October 14$/i)).toBeInTheDocument()
      const reportText = reportArticle.textContent

      // â”€â”€ 7. Archive â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      await act(async () => {
        await app.router.navigate('/archive')
      })
      expect(await screen.findByRole('heading', { name: 'Cryptid Archive' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Open dossier: The Warden' })).toBeInTheDocument()
      expect(screen.getByText(/1 of 3 identifiable entities discovered/)).toBeInTheDocument()
      expect(screen.queryByText(/The Pale Cartographer/)).not.toBeInTheDocument()
      expect(screen.queryByText(/The Drowned Choir/)).not.toBeInTheDocument()

      // â”€â”€ 8. Simulated refresh â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      flushPendingWrite()
      app.unmount()
      cleanup()
      useAppStore.setState(DEFAULT_STATE)
      expect(useAppStore.getState().reports).toEqual({})
      expect(hydrateStore()).toBe('restored')

      const reloaded = renderApp('/')
      expect(await screen.findByRole('heading', { name: 'Bureau Headquarters' })).toBeInTheDocument()
      expect(screen.getByText('CLOSED')).toBeInTheDocument()
      expect(screen.getByText('3/12')).toBeInTheDocument()
      expect(screen.getByText(/1 OF 3 IDENTIFIABLE ENTITIES DISCOVERED/)).toBeInTheDocument()
      expect(screen.getByText('VIEW FILE')).toBeInTheDocument()

      await act(async () => {
        await reloaded.router.navigate(`/case/${CASE_ID}/report`)
      })
      expect(
        await screen.findByRole('heading', { name: 'Final Investigation Report', level: 1 }),
      ).toBeInTheDocument()
      expect(screen.getByRole('article').textContent).toBe(reportText)

      // The board of a closed case redirects back to the case file.
      await act(async () => {
        await reloaded.router.navigate(`/case/${CASE_ID}/board`)
      })
      expect(await screen.findByText('REPORT FILED')).toBeInTheDocument()
      expect(reloaded.router.state.location.pathname).toBe(`/case/${CASE_ID}`)
      expect(screen.queryByLabelText('Investigation board')).not.toBeInTheDocument()
    },
    20000,
  )
})
