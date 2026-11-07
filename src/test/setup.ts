import '@testing-library/jest-dom'
import { afterEach, beforeEach } from 'vitest'
import { cancelPendingWrite } from '@/store/middleware/persistenceMiddleware'
import { clearOnboardingMemory, markOnboardingSeen } from '@/services/onboardingMemory'
import { resetOnboardingUi } from '@/hooks/useOnboarding'

// Isolation: every test starts with the Orientation Briefing already seen and closed, so existing
// tests never meet the modal. Onboarding tests call clearOnboardingMemory() themselves.
beforeEach(() => {
  clearOnboardingMemory()
  markOnboardingSeen()
  resetOnboardingUi()
})

afterEach(() => {
  cancelPendingWrite()
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.clear()
    } catch {
      // ignore
    }
  }
})

if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}

if (typeof window !== 'undefined' && typeof window.DOMMatrixReadOnly === 'undefined') {
  class DOMMatrixReadOnlyStub {
    m22 = 1
  }
  window.DOMMatrixReadOnly = DOMMatrixReadOnlyStub as unknown as typeof DOMMatrixReadOnly
}
