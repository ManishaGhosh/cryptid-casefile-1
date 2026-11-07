import { describe, expect, it } from 'vitest'
import { buildNodes, defaultGridPosition } from './boardLayout'
import { EVIDENCE } from '@/data/evidence'

describe('defaultGridPosition', () => {
  it('lays out a 2-column grid', () => {
    expect(defaultGridPosition(0)).toEqual({ x: 40, y: 40 })
    expect(defaultGridPosition(1)).toEqual({ x: 320, y: 40 })
    expect(defaultGridPosition(2)).toEqual({ x: 40, y: 240 })
    expect(defaultGridPosition(3)).toEqual({ x: 320, y: 240 })
  })
})

describe('buildNodes', () => {
  it('maps evidence data fields', () => {
    const [node] = buildNodes(['EV-001'], EVIDENCE, {}, 'case-001', { 'EV-001': 'note' })
    expect(node).toMatchObject({
      id: 'EV-001',
      type: 'evidence',
      position: { x: 40, y: 40 },
      data: {
        evidenceId: 'EV-001',
        evidenceName: 'Broken Branches',
        evidenceCategory: 'Physical Trace',
        isSelected: false,
        observationNote: 'note',
      },
    })
  })

  it('prefers persisted positions over the default', () => {
    const nodes = buildNodes(['EV-001', 'EV-002'], EVIDENCE, { 'case-001:EV-002': { x: 5, y: 9 } }, 'case-001', {})
    expect(nodes[0].position).toEqual({ x: 40, y: 40 })
    expect(nodes[1].position).toEqual({ x: 5, y: 9 })
  })

  it('skips ids without a seed item', () => {
    const nodes = buildNodes(['EV-001', 'EV-999'], EVIDENCE, {}, 'case-001', {})
    expect(nodes.map((n) => n.id)).toEqual(['EV-001'])
  })
})
