/**
 * Remembers which archive specimens have already played their one-time discovery reveal.
 *
 * Design decision: this is UI-only state, so it lives under its own tiny localStorage key
 * (`cryptid-casefiles-v1:seen`) instead of the persisted store schema. That avoids touching
 * the persistence types, selectors, validators and hydration. `resetAllProgress()` clears it.
 * All storage access is wrapped in try/catch; failures degrade to "not seen / not stored".
 */
export const REVEAL_STORAGE_KEY = 'cryptid-casefiles-v1:seen'

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(REVEAL_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

export function hasSeenReveal(cryptidId: string): boolean {
  return readIds().includes(cryptidId)
}

export function markRevealSeen(cryptidId: string): void {
  try {
    const ids = readIds()
    if (ids.includes(cryptidId)) return
    localStorage.setItem(REVEAL_STORAGE_KEY, JSON.stringify([...ids, cryptidId]))
  } catch {
    /* storage unavailable: reveal may replay next visit, which is harmless */
  }
}

export function clearRevealMemory(): void {
  try {
    localStorage.removeItem(REVEAL_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
