import { create } from 'zustand'
import { BRIEFING_STEPS } from '@/data/onboarding'
import { hasSeenOnboarding, markOnboardingSeen } from '@/services/onboardingMemory'

export type BriefingCloseReason = 'skip' | 'complete'

interface OnboardingState {
  open: boolean
  stepIndex: number
  /** Open at step 1 without touching the "seen" flag (replay from the Field Manual). */
  openBriefing: () => void
  /** Open once on a first visit; no-op when the flag is set or the briefing is already open. */
  autoOpenIfFirstRun: () => void
  /** Close for either reason; both mark the briefing as seen. */
  closeBriefing: (reason: BriefingCloseReason) => void
  next: () => void
  back: () => void
}

/**
 * Global UI state for the Orientation Briefing. Deliberately a separate store from the persisted
 * game store: it never touches game progress or the game persistence schema.
 */
export const useOnboarding = create<OnboardingState>()((set, get) => ({
  open: false,
  stepIndex: 0,
  openBriefing: () => set({ open: true, stepIndex: 0 }),
  autoOpenIfFirstRun: () => {
    if (get().open || hasSeenOnboarding()) return
    set({ open: true, stepIndex: 0 })
  },
  closeBriefing: () => {
    markOnboardingSeen()
    set({ open: false, stepIndex: 0 })
  },
  next: () => set((s) => ({ stepIndex: Math.min(s.stepIndex + 1, BRIEFING_STEPS.length - 1) })),
  back: () => set((s) => ({ stepIndex: Math.max(s.stepIndex - 1, 0) })),
}))

/** Test helper: force the briefing closed at step 1. */
export function resetOnboardingUi(): void {
  useOnboarding.setState({ open: false, stepIndex: 0 })
}
