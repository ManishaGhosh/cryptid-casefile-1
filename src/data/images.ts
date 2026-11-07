import { CASES } from '@/data/cases'
import { CRYPTIDS } from '@/data/cryptids'
import { EVIDENCE } from '@/data/evidence'

/** A bureau image slot's source. `width`/`height` are the intrinsic pixel size of the shipped file. */
export interface ImageAsset {
  src: string
  alt: string
  width: number
  height: number
}

/** One expected file under `public/images/`, relative to that folder (e.g. `cases/case-001-....webp`). */
export interface ImageManifestEntry {
  file: string
  asset: ImageAsset
}

/** Vite serves `public/` at the base path; honour it so sub-path deploys keep working. */
function publicUrl(file: string): string {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base.endsWith('/') ? base : `${base}/`}images/${file}`
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function entry(file: string, alt: string, width: number, height: number): ImageManifestEntry {
  return { file, asset: { src: publicUrl(file), alt, width, height } }
}

export const BRAND_EMBLEM: ImageAsset = {
  src: publicUrl('brand/fbci-emblem.png'),
  alt: 'Federal Bureau of Cryptid Investigation emblem',
  width: 512,
  height: 512,
}

const EMBLEM_ENTRY: ImageManifestEntry = { file: 'brand/fbci-emblem.png', asset: BRAND_EMBLEM }

const CASE_ENTRIES: Record<string, ImageManifestEntry> = Object.fromEntries(
  CASES.map((c) => {
    const place = c.location.split(',')[0].trim()
    const caseNumber = c.id.replace('case-', '')
    const title = slug(c.title).replace(/^the-/, '')
    return [
      c.id,
      entry(`cases/${c.id}-${title}.webp`, `Field photograph: ${place}, Case ${caseNumber}`, 1600, 900),
    ]
  }),
)

const EVIDENCE_ENTRIES: Record<string, ImageManifestEntry> = Object.fromEntries(
  EVIDENCE.map((e) => [
    e.id,
    entry(`evidence/${e.id.toLowerCase()}-${slug(e.name)}.webp`, `Evidence photograph: ${e.name}`, 1200, 900),
  ]),
)

/** Archive-only cryptids (no playable evidence) never get a plate in the MVP. */
const CRYPTID_ENTRIES: Record<string, ImageManifestEntry> = Object.fromEntries(
  CRYPTIDS.filter((c) => c.mvpStatus === 'playable').map((c) => [
    c.id,
    entry(`cryptids/${c.id}-${slug(c.name)}.webp`, `Specimen plate: ${c.name}`, 1000, 1250),
  ]),
)

/** Every expected image file, in brief order (emblem, cases, evidence, cryptids). */
export const IMAGE_MANIFEST: readonly ImageManifestEntry[] = [
  EMBLEM_ENTRY,
  ...Object.values(CASE_ENTRIES),
  ...Object.values(EVIDENCE_ENTRIES),
  ...Object.values(CRYPTID_ENTRIES),
]

function lookup(table: Record<string, ImageManifestEntry>, id: string): ImageAsset | null {
  return Object.prototype.hasOwnProperty.call(table, id) ? table[id].asset : null
}

export function getCaseImage(caseId: string): ImageAsset | null {
  return lookup(CASE_ENTRIES, caseId)
}

export function getEvidenceImage(evidenceId: string): ImageAsset | null {
  return lookup(EVIDENCE_ENTRIES, evidenceId)
}

/** `null` for archive-only and unknown cryptids. */
export function getCryptidImage(cryptidId: string): ImageAsset | null {
  return lookup(CRYPTID_ENTRIES, cryptidId)
}
