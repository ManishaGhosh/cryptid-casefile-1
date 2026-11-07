import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import CryptidEntry from './CryptidEntry'
import { CRYPTIDS } from '@/data/cryptids'
import { clearRevealMemory, hasSeenReveal } from '@/services/revealMemory'
import type { ArchiveEntryModel } from '@/hooks/useArchive'

const playable = CRYPTIDS.find((c) => c.mvpStatus === 'playable')!
const sealedCryptid = CRYPTIDS.find((c) => c.mvpStatus === 'archive-only')!

const unlockedEntry: ArchiveEntryModel = { cryptid: playable, unlocked: true, sealed: false }
const sealedEntry: ArchiveEntryModel = { cryptid: sealedCryptid, unlocked: false, sealed: true }

beforeEach(() => {
  vi.useFakeTimers()
  clearRevealMemory()
})
afterEach(() => {
  vi.useRealTimers()
  clearRevealMemory()
})

describe('CryptidEntry reveal', () => {
  it('plays the reveal once, then not on remount', () => {
    const first = render(<CryptidEntry entry={unlockedEntry} onOpen={() => {}} />)
    expect(first.container.querySelector('[data-reveal]')).toHaveAttribute('data-reveal', 'pending')
    expect(hasSeenReveal(playable.id)).toBe(true)
    act(() => {
      vi.advanceTimersByTime(1300)
    })
    expect(first.container.querySelector('[data-reveal]')).toHaveAttribute('data-reveal', 'done')
    first.unmount()

    const second = render(<CryptidEntry entry={unlockedEntry} onOpen={() => {}} />)
    expect(second.container.querySelector('[data-reveal]')).toHaveAttribute('data-reveal', 'done')
  })

  it('never reveals archive-only entries', () => {
    const { container } = render(<CryptidEntry entry={sealedEntry} onOpen={() => {}} />)
    expect(container.querySelector('[data-reveal]')).toHaveAttribute('data-reveal', 'none')
    expect(hasSeenReveal(sealedCryptid.id)).toBe(false)
  })
})
