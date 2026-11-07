import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import App from '@/App'
import { hydrateStore, resetHydrationFlag } from '@/store/hydration'

describe('App hydration gate', () => {
  beforeEach(() => {
    resetHydrationFlag()
  })

  it('shows a loading status before hydration, then HQ after', () => {
    render(<App />)
    expect(screen.getByRole('status')).toHaveTextContent('Retrieving case files')
    act(() => {
      hydrateStore()
    })
    expect(screen.getByText('Bureau Headquarters')).toBeInTheDocument()
  })
})
