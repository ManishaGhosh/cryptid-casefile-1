import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EvidenceSlot from './EvidenceSlot'
import { EVIDENCE } from '@/data/evidence'

const motionPref = vi.hoisted(() => ({ reduced: true }))
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return { ...actual, useReducedMotion: () => motionPref.reduced }
})

const item = EVIDENCE[0]

describe('EvidenceSlot (reduced motion)', () => {
  beforeEach(() => {
    motionPref.reduced = true
  })

  it('locked face shows name, category and CONTENTS CLASSIFIED, with no image', async () => {
    const { container } = render(<EvidenceSlot evidence={item} collected={false} onActivate={() => {}} />)
    expect(screen.getByRole('button', { name: `Collect evidence: ${item.name}` })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: item.name })).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`SEALED · ${item.category}`))).toBeInTheDocument()
    expect(screen.getByText('CONTENTS CLASSIFIED')).toBeInTheDocument()
    expect(container.querySelectorAll('img')).toHaveLength(0)
  })

  it('calls onActivate with the evidence when a locked slot is clicked', async () => {
    const onActivate = vi.fn()
    render(<EvidenceSlot evidence={item} collected={false} onActivate={onActivate} />)
    await userEvent.click(screen.getByRole('button', { name: `Collect evidence: ${item.name}` }))
    expect(onActivate).toHaveBeenCalledTimes(1)
    expect(onActivate).toHaveBeenCalledWith(item)
  })

  it('readOnly locked slot is aria-disabled and does not activate', async () => {
    const onActivate = vi.fn()
    render(<EvidenceSlot evidence={item} collected={false} readOnly onActivate={onActivate} />)
    const button = screen.getByRole('button', { name: `Locked evidence: ${item.name}` })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByText('NOT LOGGED')).toBeInTheDocument()
    await userEvent.click(button)
    expect(onActivate).not.toHaveBeenCalled()
  })

  it('collected slot renders the evidence card and still activates (examine)', async () => {
    const onActivate = vi.fn()
    render(<EvidenceSlot evidence={item} collected readOnly onActivate={onActivate} />)
    const button = screen.getByRole('button', { name: `Examine evidence: ${item.name}` })
    expect(button).not.toHaveAttribute('aria-disabled')
    expect(screen.getByText(`EXHIBIT ${item.id}`)).toBeInTheDocument()
    expect(screen.queryByText('CONTENTS CLASSIFIED')).not.toBeInTheDocument()
    await userEvent.click(button)
    expect(onActivate).toHaveBeenCalledWith(item)
  })

  it('swaps instantly to the card when collected flips (no reveal sequence)', () => {
    const { rerender } = render(<EvidenceSlot evidence={item} collected={false} onActivate={() => {}} />)
    rerender(<EvidenceSlot evidence={item} collected onActivate={() => {}} />)
    expect(screen.getByRole('button', { name: `Examine evidence: ${item.name}` })).toBeInTheDocument()
    expect(screen.getByText(`EXHIBIT ${item.id}`)).toBeInTheDocument()
    expect(screen.queryByText('DECLASSIFYING…')).not.toBeInTheDocument()
    expect(screen.queryByTestId('scan-overlay')).not.toBeInTheDocument()
  })
})

describe('EvidenceSlot (reveal sequence, motion enabled)', () => {
  beforeEach(() => {
    motionPref.reduced = false
  })

  // Limitation: framer-motion's onAnimationComplete callbacks are driven by requestAnimationFrame
  // and may not complete the scan -> wipe -> settle chain in jsdom, so the final card state after
  // the full ~800ms sequence is not asserted; the intermediate state and element identity are.
  it('keeps the locked face and scan overlay while revealing, on the same focused button', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<EvidenceSlot evidence={item} collected={false} onActivate={() => {}} />)
    const button = screen.getByRole('button', { name: `Collect evidence: ${item.name}` })
    await user.click(button)
    expect(button).toHaveFocus()

    rerender(<EvidenceSlot evidence={item} collected onActivate={() => {}} />)

    const same = screen.getByRole('button', { name: `Examine evidence: ${item.name}` })
    expect(same).toBe(button)
    expect(same).toHaveFocus()
    // Mid-sequence: still the sealed face, now reading LOGGING…, with the scan sweep running.
    expect(screen.getByText('LOGGING…')).toBeInTheDocument()
    expect(screen.getByText('CONTENTS CLASSIFIED')).toBeInTheDocument()
    expect(screen.getByTestId('scan-overlay')).toBeInTheDocument()
    expect(screen.queryByText(`EXHIBIT ${item.id}`)).not.toBeInTheDocument()
  })
})
