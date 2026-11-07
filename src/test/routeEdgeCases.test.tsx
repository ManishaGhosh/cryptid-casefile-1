/**
 * Task 10.3 review pass: routing guards, cross-case isolation of the ephemeral identification
 * result, and live updates of derived counts. Uses the real routes with `createMemoryRouter`.
 */
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { routes, routerFuture } from '@/router'
import { useAppStore } from '@/store'
import { cancelPendingWrite } from '@/store/middleware/persistenceMiddleware'
import { clearEvidenceDrafts } from '@/components/features/case/EvidencePanel'
import { runIdentification } from '@/services/identificationEngine'
import { CASES } from '@/data/cases'
import { CRYPTIDS } from '@/data/cryptids'
import { EVIDENCE } from '@/data/evidence'
import { installFlowTestEnv, uninstallFlowTestEnv } from './flowTestEnv'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return { ...actual, useReducedMotion: () => true }
})

beforeAll(installFlowTestEnv)
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

beforeEach(() => {
  cancelPendingWrite()
  window.localStorage.clear()
  clearEvidenceDrafts()
  useAppStore.setState(DEFAULT_STATE)
})

function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path], future: routerFuture })
  const view = render(<RouterProvider router={router} />)
  return { router, ...view }
}

async function go(router: ReturnType<typeof createMemoryRouter>, path: string) {
  await act(async () => {
    await router.navigate(path)
  })
}

describe('unknown routes and case ids', () => {
  it.each([['/nope'], ['/case/case-999'], ['/case/case-999/board'], ['/case/case-999/report'], ['/case']])(
    '%s redirects to HQ',
    async (path) => {
      const app = renderApp(path)
      expect(await screen.findByRole('heading', { name: 'Bureau Headquarters' })).toBeInTheDocument()
      expect(app.router.state.location.pathname).toBe('/')
    },
  )

  it('keeps the "File not found" fallback for a case page whose data is missing', async () => {
    // The route loader redirects unknown ids, so reach the component's own fallback directly.
    const { default: CaseDetailPage } = await import('@/pages/CaseDetailPage')
    const { MemoryRouter, Route, Routes } = await import('react-router-dom')
    render(
      <MemoryRouter initialEntries={['/case/case-999']}>
        <Routes>
          <Route path="/case/:caseId" element={<CaseDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('FILE NOT FOUND')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /bureau hq/i })).toBeInTheDocument()
  })
})

describe('guards for closed and unfiled cases', () => {
  it('redirects a report URL with no filed report to the case file', async () => {
    const app = renderApp('/case/case-001/report')
    expect(await screen.findByRole('heading', { name: CASES[0].title, level: 1 })).toBeInTheDocument()
    expect(app.router.state.location.pathname).toBe('/case/case-001')
  })

  it('redirects the board URL of a case with no evidence to the case file', async () => {
    const app = renderApp('/case/case-002/board')
    expect(await screen.findByRole('heading', { name: CASES[1].title, level: 1 })).toBeInTheDocument()
    expect(app.router.state.location.pathname).toBe('/case/case-002')
  })

  it('redirects the board URL of a closed case to the case file', async () => {
    useAppStore.setState({
      caseStatuses: { 'case-001': 'closed' },
      collectedEvidence: { 'case-001': ['EV-001', 'EV-002', 'EV-003'] },
    })
    const app = renderApp('/case/case-001/board')
    expect(await screen.findByRole('heading', { name: CASES[0].title, level: 1 })).toBeInTheDocument()
    expect(app.router.state.location.pathname).toBe('/case/case-001')
    expect(screen.queryByLabelText('Investigation board')).not.toBeInTheDocument()
  })
})

describe('lastIdentificationResult is scoped to the case that produced it', () => {
  it('never shows a stale result on another case board (store seeded directly)', async () => {
    const caseOne = CASES[0]
    const stale = runIdentification({
      caseData: caseOne,
      submittedCryptidId: 'cryptid-002',
      collectedEvidenceIds: ['EV-001', 'EV-002'],
      cryptids: CRYPTIDS,
      evidence: EVIDENCE,
    })
    useAppStore.setState({
      caseStatuses: { 'case-001': 'in-progress', 'case-002': 'in-progress' },
      collectedEvidence: { 'case-001': ['EV-001', 'EV-002'], 'case-002': ['EV-005', 'EV-006'] },
      lastIdentificationResult: stale,
    })
    renderApp('/case/case-002/board')
    expect(await screen.findByLabelText('Investigation board')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('clears the result when leaving a board after a submission and does not show it on the next board', async () => {
    const user = userEvent.setup()
    useAppStore.setState({
      caseStatuses: { 'case-001': 'in-progress', 'case-002': 'in-progress' },
      collectedEvidence: { 'case-001': ['EV-001', 'EV-002'], 'case-002': ['EV-005', 'EV-006'] },
    })
    const app = renderApp('/case/case-001/board')
    await screen.findByLabelText('Investigation board')
    await user.click(screen.getByRole('radio', { name: /^The Hollow/ }))
    await user.click(screen.getByRole('button', { name: 'Submit Investigation' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('INCONCLUSIVE')).toBeInTheDocument()
    expect(useAppStore.getState().lastIdentificationResult).not.toBeNull()

    await go(app.router, '/case/case-002/board')
    expect(await screen.findByRole('heading', { name: CASES[1].title, level: 1 })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(useAppStore.getState().lastIdentificationResult).toBeNull()
  })
})

describe('derived counts update immediately', () => {
  it('logging evidence on the board tray updates the case file and HQ tiles', async () => {
    const user = userEvent.setup()
    useAppStore.setState({
      caseStatuses: { 'case-001': 'in-progress' },
      collectedEvidence: { 'case-001': ['EV-001', 'EV-002'] },
    })
    const app = renderApp('/case/case-001/board')
    const tray = await screen.findByRole('region', { name: 'Evidence tray' })
    await user.click(within(tray).getByRole('button', { name: 'Log EV-003' }))
    expect(within(tray).getByText('3 / 4 logged')).toBeInTheDocument()

    await go(app.router, '/case/case-001')
    expect(await screen.findByText('3 / 4 logged')).toBeInTheDocument()
    expect(screen.getByText('3/4')).toBeInTheDocument()

    await go(app.router, '/')
    expect(await screen.findByRole('heading', { name: 'Bureau Headquarters' })).toBeInTheDocument()
    const tile = screen.getByText('Evidence Logged').parentElement?.parentElement
    expect(tile?.textContent).toBe(`Evidence Logged3/${EVIDENCE.length}`)
    cleanup()
  })
})
