import { act, cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '@/store'
import { BRIEFING_STEPS } from '@/data/onboarding'
import { ONBOARDING_KEY, clearOnboardingMemory } from '@/services/onboardingMemory'
import { resetAllProgress } from '@/services/resetProgress'
import { renderRoute, useJsdomRouterSupport } from '@/test/routerHarness'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return { ...actual, useReducedMotion: () => true }
})

useJsdomRouterSupport()

const flagSet = (): boolean => window.localStorage.getItem(ONBOARDING_KEY) !== null

describe('OrientationBriefing', () => {
  beforeEach(() => {
    clearOnboardingMemory() // first-time visitor
  })
  afterEach(() => {
    cleanup()
    useAppStore.setState({ collectedEvidence: {}, caseStatuses: {} })
  })

  it('opens automatically on the first visit at step 1 of 6', async () => {
    renderRoute('/case/case-001')
    const dialog = await screen.findByRole('dialog', { name: BRIEFING_STEPS[0].title })
    expect(within(dialog).getByText('Step 1 of 6')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Back' })).toBeDisabled()
    expect(within(dialog).getByRole('button', { name: 'Next' })).toHaveFocus()
    expect(flagSet()).toBe(false)
  })

  it('walks all six steps, completes, sets the flag and does not reopen on remount', async () => {
    const user = userEvent.setup()
    const first = renderRoute('/case/case-001')
    await screen.findByRole('dialog')
    for (let i = 1; i < 6; i++) {
      await user.click(screen.getByRole('button', { name: 'Next' }))
      expect(screen.getByText(`Step ${i + 1} of 6`)).toBeInTheDocument()
      expect(screen.getByRole('dialog', { name: BRIEFING_STEPS[i].title })).toBeInTheDocument()
    }
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Begin investigation' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(flagSet()).toBe(true)

    first.unmount()
    renderRoute('/case/case-001')
    await screen.findByRole('heading', { level: 1 })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Escape closes as skip and sets the flag', async () => {
    const user = userEvent.setup()
    renderRoute('/case/case-001')
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(flagSet()).toBe(true)
  })

  it('"Skip briefing" closes and sets the flag, leaving the player on the same page', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/case/case-001')
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: 'Skip briefing' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(flagSet()).toBe(true)
    expect(router.state.location.pathname).toBe('/case/case-001')
  })

  it('does not close on scrim click, supports arrow keys and traps Tab', async () => {
    const user = userEvent.setup()
    renderRoute('/')
    const dialog = await screen.findByRole('dialog')
    await user.click(dialog.parentElement as HTMLElement)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // A scrim click drops focus to the page; arrows act only while focus is inside the dialog.
    screen.getByRole('button', { name: 'Next' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByText('Step 2 of 6')).toBeInTheDocument()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByText('Step 1 of 6')).toBeInTheDocument()

    // Next is the last enabled control on step 1 (Back is disabled); Tab wraps to Skip.
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Skip briefing' })).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus()
  })

  it('replays from the sidebar Field Manual at step 1 without navigating or touching progress', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/case/case-001')
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: 'Skip briefing' }))
    await screen.findByRole('heading', { level: 1 })

    act(() => {
      useAppStore.getState().collectEvidence('case-001', 'EV-001')
    })
    const before = JSON.stringify({
      statuses: useAppStore.getState().caseStatuses,
      evidence: useAppStore.getState().collectedEvidence,
    })

    const manual = screen.getByRole('button', { name: /field manual/i })
    manual.focus()
    await user.click(manual)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Step 1 of 6')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/case/case-001')
    expect(manual).toHaveFocus()
    const after = JSON.stringify({
      statuses: useAppStore.getState().caseStatuses,
      evidence: useAppStore.getState().collectedEvidence,
    })
    expect(after).toBe(before)
  })

  it('keeps the flag after Reset All Progress', async () => {
    const user = userEvent.setup()
    renderRoute('/')
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: 'Skip briefing' }))
    act(() => {
      resetAllProgress()
    })
    expect(flagSet()).toBe(true)
  })
})
