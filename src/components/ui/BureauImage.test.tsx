import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import BureauImage from './BureauImage'
import type { ImageAsset } from '@/data/images'

const asset: ImageAsset = { src: '/images/cases/test.webp', alt: 'Field photograph: Test Site, Case 001', width: 1600, height: 900 }
const fallback = <p>FALLBACK MOUNT</p>

afterEach(cleanup)

describe('BureauImage', () => {
  it('renders only the fallback, and no <img>, when the asset is null', () => {
    const { container } = render(<BureauImage asset={null} fallback={fallback} aspect="16/9" />)
    expect(screen.getByText('FALLBACK MOUNT')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })

  it('renders a lazy, async, hidden-until-loaded <img> with the asset alt text above the fallback', () => {
    const { container } = render(<BureauImage asset={asset} fallback={fallback} aspect="16/9" />)
    const img = screen.getByAltText(asset.alt)
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('decoding', 'async')
    expect(img).toHaveAttribute('width', '1600')
    expect(img).toHaveAttribute('height', '900')
    expect(img).toHaveClass('opacity-0')
    expect(screen.getByText('FALLBACK MOUNT')).toBeInTheDocument()
    expect(container.querySelector('.aspect-\\[16\\/9\\]')).not.toBeNull()
  })

  it('removes the <img> on error so no broken-image icon shows, leaving the fallback', () => {
    const { container } = render(<BureauImage asset={asset} fallback={fallback} aspect="16/9" />)
    fireEvent.error(screen.getByAltText(asset.alt))
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('FALLBACK MOUNT')).toBeVisible()
  })

  it('fades the image in on load and hides the fallback from assistive tech', () => {
    render(<BureauImage asset={asset} fallback={fallback} aspect="16/9" />)
    const img = screen.getByAltText(asset.alt)
    fireEvent.load(img)
    expect(img).toHaveClass('opacity-100')
    expect(img).not.toHaveClass('opacity-0')
    expect(screen.getByText('FALLBACK MOUNT').parentElement).toHaveAttribute('aria-hidden', 'true')
  })

  it('uses empty alt and aria-hidden for decorative images, and eager loading for priority', () => {
    const { container } = render(<BureauImage asset={asset} fallback={fallback} aspect="1/1" decorative priority />)
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img).toHaveAttribute('alt', '')
    expect(img).toHaveAttribute('aria-hidden', 'true')
    expect(img).toHaveAttribute('loading', 'eager')
  })

  it('takes no space with no placeholder until the image loads', () => {
    const { container } = render(<BureauImage asset={asset} fallback={null} aspect="4/3" treatment="photo" />)
    const frame = container.firstElementChild as HTMLElement
    expect(frame.className).not.toContain('border')
    fireEvent.load(screen.getByAltText(asset.alt))
    expect(frame.className).toContain('border')
  })
})
