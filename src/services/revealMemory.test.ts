import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearRevealMemory, hasSeenReveal, markRevealSeen, REVEAL_STORAGE_KEY } from './revealMemory'
import { resetAllProgress } from './resetProgress'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('revealMemory', () => {
  it('marks, checks and clears', () => {
    expect(hasSeenReveal('cryptid-001')).toBe(false)
    markRevealSeen('cryptid-001')
    expect(hasSeenReveal('cryptid-001')).toBe(true)
    expect(hasSeenReveal('cryptid-002')).toBe(false)
    clearRevealMemory()
    expect(hasSeenReveal('cryptid-001')).toBe(false)
  })

  it('tolerates corrupt data', () => {
    localStorage.setItem(REVEAL_STORAGE_KEY, '{nope')
    expect(hasSeenReveal('x')).toBe(false)
    markRevealSeen('x')
    expect(hasSeenReveal('x')).toBe(true)
  })

  it('does not throw when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(() => markRevealSeen('a')).not.toThrow()
    expect(hasSeenReveal('a')).toBe(false)
    expect(() => clearRevealMemory()).not.toThrow()
  })

  it('is cleared by resetAllProgress', () => {
    markRevealSeen('cryptid-001')
    resetAllProgress()
    expect(hasSeenReveal('cryptid-001')).toBe(false)
  })
})
