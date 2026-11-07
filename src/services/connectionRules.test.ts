import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { canConnect, makeConnection, MAX_CONNECTION_LABEL } from './connectionRules'

describe('connectionRules', () => {
  it('exposes the label limit', () => {
    expect(MAX_CONNECTION_LABEL).toBe(80)
  })

  it('rejects self-loops', () => {
    expect(canConnect('A', 'A', [])).toBe(false)
  })

  it('rejects duplicates in both directions', () => {
    const existing = [makeConnection('A', 'B')]
    expect(canConnect('A', 'B', existing)).toBe(false)
    expect(canConnect('B', 'A', existing)).toBe(false)
  })

  it('allows a distinct pair', () => {
    expect(canConnect('A', 'C', [makeConnection('A', 'B')])).toBe(true)
  })

  it('makes order-independent ids', () => {
    expect(makeConnection('A', 'B').id).toBe(makeConnection('B', 'A').id)
    expect(makeConnection('A', 'B').data).toEqual({ label: '' })
  })

  it('property: self-loops never allowed; reverse of an added pair rejected', () => {
    const id = fc.constantFrom('EV-001', 'EV-002', 'EV-003', 'EV-004')
    fc.assert(
      fc.property(id, id, (a, b) => {
        expect(canConnect(a, a, [])).toBe(false)
        if (a !== b) {
          expect(canConnect(b, a, [makeConnection(a, b)])).toBe(false)
        }
      }),
    )
  })
})
