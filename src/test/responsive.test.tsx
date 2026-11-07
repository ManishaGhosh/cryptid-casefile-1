/**
 * Behavioural checks for the responsive shell. jsdom has no layout, so nothing here asserts
 * pixel sizes: the viewport is simulated by stubbing `matchMedia` (min-width queries only), which
 * is what the layout reads to decide whether the sidebar is a permanent column or a drawer.
 */
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '@/store'
import { cancelPendingWrite } from '@/store/middleware/persistenceMiddleware'
import { renderRoute, seedRichState, useJsdomRouterSupport } from '@/test/routerHarness'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return { ...actual, useReducedMotion: () => true }
})

/** Makes `window.matchMedia` answer `(min-width: Npx)` queries for the given viewport width. */
function setViewportWidth(width: number): void {
  const matchMedia = (query: string): MediaQueryList => {
    const m = /\(min-width:\s*(\d+)px\)/.exec(query)
    const matches = m ? width >= Number(m[1]) : false
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }
  }
  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: matchMedia })
}

describe('responsive shell', () => {
  useJsdomRouterSupport()

  beforeEach(() => {
    cleanup()
    cancelPendingWrite()
    window.localStorage.clear()
    seedRichState()
  })

  afterEach(() => {
    Reflect.deleteProperty(window, 'matchMedia')
  })

  describe('tablet (768px): the sidebar is an off-canvas drawer', () => {
    beforeEach(() => setViewportWidth(768))

    it('is closed and unreachable by default (inert + hidden from assistive tech)', async () => {
      renderRoute('/')
      await screen.findByRole('heading', { level: 1, name: 'Bureau Headquarters' })
      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar).toHaveAttribute('inert')
      expect(sidebar).toHaveAttribute('aria-hidden', 'true')
      expect(screen.queryByRole('navigation', { name: 'Bureau navigation' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveAttribute('aria-expanded', 'false')
    })

    it('opens from the menu button, moves focus into the drawer, and becomes reachable', async () => {
      const user = userEvent.setup()
      renderRoute('/')
      await screen.findByRole('heading', { level: 1, name: 'Bureau Headquarters' })

      await user.click(screen.getByRole('button', { name: 'Open navigation' }))

      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar).not.toHaveAttribute('inert')
      expect(sidebar).not.toHaveAttribute('aria-hidden')
      expect(screen.getByRole('navigation', { name: 'Bureau navigation' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Close navigation' })).toHaveFocus()
      expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveAttribute('aria-expanded', 'true')
    })

    it('closes on Escape and returns focus to the menu button', async () => {
      const user = userEvent.setup()
      renderRoute('/')
      await screen.findByRole('heading', { level: 1, name: 'Bureau Headquarters' })
      const menuButton = screen.getByRole('button', { name: 'Open navigation' })

      await user.click(menuButton)
      await user.keyboard('{Escape}')

      expect(screen.getByTestId('sidebar')).toHaveAttribute('inert')
      expect(menuButton).toHaveFocus()
      expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('closes from the close button and from the scrim, restoring focus each time', async () => {
      const user = userEvent.setup()
      renderRoute('/')
      await screen.findByRole('heading', { level: 1, name: 'Bureau Headquarters' })
      const menuButton = screen.getByRole('button', { name: 'Open navigation' })

      await user.click(menuButton)
      await user.click(screen.getByRole('button', { name: 'Close navigation' }))
      expect(screen.getByTestId('sidebar')).toHaveAttribute('inert')
      expect(menuButton).toHaveFocus()

      await user.click(menuButton)
      await user.click(screen.getByTestId('sidebar-scrim'))
      expect(screen.getByTestId('sidebar')).toHaveAttribute('inert')
      expect(menuButton).toHaveFocus()
    })

    it('keeps Tab inside the open drawer', async () => {
      const user = userEvent.setup()
      renderRoute('/')
      await screen.findByRole('heading', { level: 1, name: 'Bureau Headquarters' })
      await user.click(screen.getByRole('button', { name: 'Open navigation' }))

      const sidebar = screen.getByTestId('sidebar')
      const focusables = Array.from(sidebar.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
      expect(focusables.length).toBeGreaterThan(2)
      const last = focusables[focusables.length - 1]
      last.focus()
      await user.tab()
      expect(focusables[0]).toHaveFocus()
      await user.tab({ shift: true })
      expect(last).toHaveFocus()
    })

    it('navigating from the drawer closes it and moves focus to the page', async () => {
      const user = userEvent.setup()
      renderRoute('/')
      await screen.findByRole('heading', { level: 1, name: 'Bureau Headquarters' })
      await user.click(screen.getByRole('button', { name: 'Open navigation' }))

      await user.click(screen.getByRole('link', { name: /cryptid archive/i }))

      await screen.findByRole('heading', { level: 1, name: 'Cryptid Archive' })
      expect(screen.getByTestId('sidebar')).toHaveAttribute('inert')
      expect(screen.getByRole('main')).toHaveFocus()
    })
  })

  describe('desktop (1280px): the sidebar is a permanent column', () => {
    beforeEach(() => setViewportWidth(1280))

    it('is always reachable and never inert', async () => {
      renderRoute('/')
      await screen.findByRole('heading', { level: 1, name: 'Bureau Headquarters' })
      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar).not.toHaveAttribute('inert')
      expect(sidebar).not.toHaveAttribute('aria-hidden')
      expect(screen.getByRole('navigation', { name: 'Bureau navigation' })).toBeInTheDocument()
    })
  })

  describe('investigation board', () => {
    it.each([375, 768, 1024, 1280])('renders the canvas, evidence tray and hypothesis form at %ipx', async (width) => {
      setViewportWidth(width)
      renderRoute('/case/case-002/board')
      await screen.findByRole('heading', { level: 1, name: 'The Hollow Lake' })
      expect(screen.getByRole('region', { name: 'Investigation board' })).toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'Evidence tray' })).toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'Hypothesis' })).toBeInTheDocument()
      expect(useAppStore.getState().caseStatuses['case-002']).toBe('in-progress')
    })
  })
})
