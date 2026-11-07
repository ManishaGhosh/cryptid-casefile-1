import { render } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { afterAll, beforeAll } from 'vitest'
import { routes, routerFuture } from '@/router'
import { useAppStore } from '@/store'
import { makeReport } from '@/test/reportFixture'

/**
 * Shared helpers for tests that render the real route tree (`routes` from `@/router`).
 */

/**
 * jsdom's AbortSignal is rejected by Node's native Request, which React Router's data router
 * uses for every navigation. Drop the (unneeded) signal so real route loaders can run in jsdom.
 * Call once inside a `describe`; it installs / restores the patch with beforeAll / afterAll.
 */
export function useJsdomRouterSupport(): void {
  const NativeRequest = globalThis.Request
  class JsdomSafeRequest extends NativeRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      if (init && init.signal) {
        const rest: RequestInit = { ...init }
        delete rest.signal
        super(input, rest)
      } else {
        super(input, init)
      }
    }
  }
  beforeAll(() => {
    globalThis.Request = JsdomSafeRequest
  })
  afterAll(() => {
    globalThis.Request = NativeRequest
  })
}

export function renderRoute(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path], future: routerFuture })
  const view = render(<RouterProvider router={router} />)
  return { router, ...view }
}

/**
 * Store state that exercises every screen: case-001 closed with a filed report and the first
 * cryptid unlocked; case-002 in progress with three evidence items logged (and a note).
 */
export function seedRichState(): void {
  useAppStore.setState({
    caseStatuses: { 'case-001': 'closed', 'case-002': 'in-progress' },
    collectedEvidence: {
      'case-001': ['EV-001', 'EV-002', 'EV-003'],
      'case-002': ['EV-005', 'EV-006', 'EV-007'],
    },
    observationNotes: { 'EV-006': 'Light pulse near the pier.' },
    nodePositions: {},
    connections: {},
    unlockedCryptidIds: ['cryptid-001'],
    reports: { 'case-001': makeReport() },
    lastIdentificationResult: null,
  })
}
