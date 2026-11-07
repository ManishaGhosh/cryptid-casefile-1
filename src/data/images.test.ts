import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CASES } from '@/data/cases'
import { CRYPTIDS } from '@/data/cryptids'
import { EVIDENCE } from '@/data/evidence'
import { BRAND_EMBLEM, IMAGE_MANIFEST, getCaseImage, getCryptidImage, getEvidenceImage } from '@/data/images'

const BRIEF = readFileSync(join(process.cwd(), 'public', 'images', 'IMAGE_BRIEF.md'), 'utf8')

describe('image manifest', () => {
  it('lists exactly the 19 brief files, all unique', () => {
    expect(IMAGE_MANIFEST).toHaveLength(19)
    expect(new Set(IMAGE_MANIFEST.map((e) => e.file)).size).toBe(19)
  })

  it.each(IMAGE_MANIFEST.map((e) => e.file))('IMAGE_BRIEF.md lists %s', (file) => {
    expect(BRIEF).toContain(`\`${file}\``)
  })

  it('serves every asset from /images/ with matching dimensions and non-empty alt text', () => {
    for (const { file, asset } of IMAGE_MANIFEST) {
      expect(asset.src.endsWith(`/images/${file}`)).toBe(true)
      expect(asset.alt.length).toBeGreaterThan(0)
      expect(asset.width).toBeGreaterThan(0)
      expect(asset.height).toBeGreaterThan(0)
    }
  })

  it('maps every case, evidence item and playable cryptid, with alt text from seed data', () => {
    for (const c of CASES) expect(getCaseImage(c.id)).not.toBeNull()
    for (const e of EVIDENCE) expect(getEvidenceImage(e.id)?.alt).toBe(`Evidence photograph: ${e.name}`)
    expect(getCryptidImage('cryptid-001')?.alt).toBe('Specimen plate: The Warden')
    expect(getCaseImage('case-001')?.alt).toBe('Field photograph: Harrow Pines State Forest, Case 001')
    expect(BRAND_EMBLEM.width).toBe(512)
  })

  it('returns null for archive-only and unknown ids', () => {
    for (const c of CRYPTIDS.filter((x) => x.mvpStatus === 'archive-only')) expect(getCryptidImage(c.id)).toBeNull()
    expect(getCryptidImage('nope')).toBeNull()
    expect(getEvidenceImage('EV-999')).toBeNull()
    expect(getCaseImage('toString')).toBeNull()
  })
})
