/**
 * Remembers whether the player has seen the first-run Orientation Briefing.
 *
 * Design decision: this is UI-only state with its own tiny localStorage key, deliberately NOT part
 * of the persisted game schema, and deliberately NOT cleared by `resetAllProgress()` (a player who
 * purges their records should not be re-briefed). All storage access is wrapped in try/catch;
 * corrupt or unavailable storage reads as "not seen". A module-level flag is also set whenever the
 * briefing is marked seen, so it shows at most once per page load even if storage cannot be written.
 */
export const ONBOARDING_KEY = 'cryptid-casefiles-v1:onboarding'

/** True once the briefing has been closed during this page load (storage-independent). */
let seenThisLoad = false

function defaultStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function hasSeenOnboarding(storage?: Storage | null): boolean {
  if (seenThisLoad) return true
  try {
    const store = storage === undefined ? defaultStorage() : storage
    const raw = store?.getItem(ONBOARDING_KEY)
    if (!raw) return false
    const parsed: unknown = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null && (parsed as { seen?: unknown }).seen === true
  } catch {
    return false
  }
}

export function markOnboardingSeen(storage?: Storage | null): void {
  seenThisLoad = true
  try {
    const store = storage === undefined ? defaultStorage() : storage
    store?.setItem(ONBOARDING_KEY, JSON.stringify({ seen: true, at: new Date().toISOString() }))
  } catch {
    /* storage unavailable: the in-memory flag still prevents a repeat this page load */
  }
}

/** Forget the flag in storage and in memory. Used by tests; never called by reset-progress. */
export function clearOnboardingMemory(storage?: Storage | null): void {
  seenThisLoad = false
  try {
    const store = storage === undefined ? defaultStorage() : storage
    store?.removeItem(ONBOARDING_KEY)
  } catch {
    /* ignore */
  }
}
