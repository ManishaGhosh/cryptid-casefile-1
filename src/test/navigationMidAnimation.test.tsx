/**
 * Task 10.3 review pass: navigating between cases while the case-opening cover and the page
 * transition are still animating (motion NOT reduced here) must leave no stale overlay or
 * previous page behind, and must not strand focus on a removed element.
 */
import { act, render, screen, waitFor } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { routes, routerFuture } from '@/router'
import { useAppStore } from '@/store'
import { cancelPendingWrite } from '@/store/middleware/persistenceMiddleware'
import { CASES } from '@/data/cases'
import { installFlowTestEnv, uninstallFlowTestEnv } from './flowTestEnv'

beforeAll(installFlowTestEnv)
afterAll(uninstallFlowTestEnv)

beforeEach(() => {
  cancelPendingWrite()
  window.localStorage.clear()
  useAppStore.setState({
    caseStatuses: {},
    collectedEvidence: {},
    observationNotes: {},
    nodePositions: {},
    connections: {},
    unlockedCryptidIds: [],
    reports: {},
    lastIdentificationResult: null,
  })
})

describe('navigation while animating', () => {
  it('rapid case-to-case navigation settles on the last page with no stale cover', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/case/case-001'], future: routerFuture })
    render(<RouterProvider router={router} />)
    expect(await screen.findByRole('heading', { name: CASES[0].title, level: 1 })).toBeInTheDocument()

    // Fire several navigations without waiting for the cover or page transitions to finish.
    await act(async () => {
      void router.navigate('/case/case-002')
      void router.navigate('/case/case-003')
      void router.navigate('/case/case-002')
    })

    expect(await screen.findByRole('heading', { name: CASES[1].title, level: 1 }, { timeout: 4000 })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByTestId('case-cover')).not.toBeInTheDocument(), { timeout: 4000 })
    expect(screen.queryByRole('heading', { name: CASES[0].title, level: 1 })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: CASES[2].title, level: 1 })).not.toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/case/case-002')
    expect(document.activeElement === null || document.body.contains(document.activeElement)).toBe(true)
  })

  it('leaving a case page mid-reveal for HQ shows only HQ afterwards', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/case/case-001'], future: routerFuture })
    render(<RouterProvider router={router} />)
    await screen.findByRole('heading', { name: CASES[0].title, level: 1 })
    await act(async () => {
      void router.navigate('/')
    })
    expect(await screen.findByRole('heading', { name: 'Bureau Headquarters' }, { timeout: 4000 })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByTestId('case-cover')).not.toBeInTheDocument(), { timeout: 4000 })
    expect(screen.queryByRole('heading', { name: CASES[0].title, level: 1 })).not.toBeInTheDocument()
    expect(document.querySelectorAll('[data-testid="case-cover"]')).toHaveLength(0)
  })
})
