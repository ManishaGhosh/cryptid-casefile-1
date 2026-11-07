import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

let reduced = true
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return { ...actual, useReducedMotion: () => reduced }
})

import StatusLight from './StatusLight'
import ScanOverlay from './ScanOverlay'
import Stamp from './Stamp'

describe('StatusLight', () => {
  it('exposes an sr-only label', () => {
    reduced = false
    render(<StatusLight tone="green" label="Network secure" />)
    expect(screen.getByText('Network secure')).toHaveClass('sr-only')
  })

  it('applies flicker only when motion is allowed', () => {
    reduced = false
    const { unmount } = render(<StatusLight tone="green" flicker label="a" />)
    expect(screen.getByTestId('status-light')).toHaveClass('status-flicker')
    unmount()
    reduced = true
    render(<StatusLight tone="green" flicker label="b" />)
    expect(screen.getByTestId('status-light')).not.toHaveClass('status-flicker')
  })
})

describe('ScanOverlay', () => {
  it('renders nothing and calls onDone immediately when reduced', () => {
    reduced = true
    const onDone = vi.fn()
    const { container } = render(<ScanOverlay active onDone={onDone} />)
    expect(container).toBeEmptyDOMElement()
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('renders the sweep when motion is allowed', () => {
    reduced = false
    render(<ScanOverlay active />)
    expect(screen.getByTestId('scan-overlay')).toBeInTheDocument()
  })
})

describe('Stamp', () => {
  it('renders its text and is aria-hidden by default', () => {
    reduced = true
    render(<Stamp tone="red">CLASSIFIED</Stamp>)
    expect(screen.getByText('CLASSIFIED')).toBeInTheDocument()
    expect(screen.getByTestId('stamp')).toHaveAttribute('aria-hidden', 'true')
    expect(document.querySelector('.sr-only')).toBeNull()
  })

  it('adds an sr-only label when provided', () => {
    reduced = true
    render(<Stamp tone="gold" label="Status: logged">LOGGED</Stamp>)
    expect(screen.getByText('Status: logged')).toHaveClass('sr-only')
  })
})
