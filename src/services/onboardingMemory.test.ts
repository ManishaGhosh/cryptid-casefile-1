import { beforeEach, describe, expect, it } from 'vitest'
import {
  ONBOARDING_KEY,
  clearOnboardingMemory,
  hasSeenOnboarding,
  markOnboardingSeen,
} from '@/services/onboardingMemory'
import { resetAllProgress } from '@/services/resetProgress'

function fakeStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial))
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (k: string) => data.get(k) ?? null,
    key: (i: number) => Array.from(data.keys())[i] ?? null,
    removeItem: (k: string) => void data.delete(k),
    setItem: (k: string, v: string) => void data.set(k, v),
  }
}

function throwingStorage(): Storage {
  const boom = (): never => {
    throw new Error('storage unavailable')
  }
  return { length: 0, clear: boom, getItem: boom, key: boom, removeItem: boom, setItem: boom }
}

describe('onboardingMemory', () => {
  beforeEach(() => {
    clearOnboardingMemory()
  })

  it('reads as unseen when nothing is stored, then seen after marking', () => {
    const storage = fakeStorage()
    expect(hasSeenOnboarding(storage)).toBe(false)
    markOnboardingSeen(storage)
    const stored: unknown = JSON.parse(storage.getItem(ONBOARDING_KEY) ?? 'null')
    expect(stored).toMatchObject({ seen: true })
    expect(hasSeenOnboarding(storage)).toBe(true)
  })

  it('reads a stored flag from a previous page load', () => {
    const storage = fakeStorage({ [ONBOARDING_KEY]: JSON.stringify({ seen: true, at: new Date().toISOString() }) })
    expect(hasSeenOnboarding(storage)).toBe(true)
  })

  it.each(['{not json', 'null', '"yes"', '{"seen":false}', '{"seen":"true"}', '[]'])(
    'treats corrupt or unexpected value %s as not seen',
    (raw) => {
      expect(hasSeenOnboarding(fakeStorage({ [ONBOARDING_KEY]: raw }))).toBe(false)
    },
  )

  it('never throws when storage throws, and shows at most once per page load', () => {
    const storage = throwingStorage()
    expect(hasSeenOnboarding(storage)).toBe(false)
    expect(() => markOnboardingSeen(storage)).not.toThrow()
    expect(hasSeenOnboarding(storage)).toBe(true)
    expect(() => clearOnboardingMemory(storage)).not.toThrow()
    expect(hasSeenOnboarding(storage)).toBe(false)
  })

  it('tolerates missing storage', () => {
    expect(hasSeenOnboarding(null)).toBe(false)
    markOnboardingSeen(null)
    expect(hasSeenOnboarding(null)).toBe(true)
  })

  it('clear removes the stored flag', () => {
    const storage = fakeStorage()
    markOnboardingSeen(storage)
    clearOnboardingMemory(storage)
    expect(storage.getItem(ONBOARDING_KEY)).toBeNull()
    expect(hasSeenOnboarding(storage)).toBe(false)
  })

  it('resetAllProgress() does not clear the flag', () => {
    markOnboardingSeen()
    resetAllProgress()
    expect(window.localStorage.getItem(ONBOARDING_KEY)).not.toBeNull()
    expect(hasSeenOnboarding()).toBe(true)
  })
})
