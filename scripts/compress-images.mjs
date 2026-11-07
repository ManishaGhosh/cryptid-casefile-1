#!/usr/bin/env node
/**
 * Compress Cryptid Casefiles images for the web.
 *
 * Default (safe preview): writes compressed copies to .image-output/<folder>/ and leaves
 * public/images untouched, so you can compare before replacing anything.
 *
 *   npm run images:compress                      -> evidence/ preview
 *   npm run images:compress -- --folder cases    -> another folder (brand|cases|evidence|cryptids)
 *   npm run images:compress -- --all             -> every folder
 *   npm run images:compress -- --replace         -> back up originals to .image-backup/, then
 *                                                   overwrite them in public/images (same names)
 *
 * Images are resized to fit inside the target size (aspect ratio kept, never enlarged) and
 * re-encoded as WebP. Quality steps down until the file is under the size budget. A file is only
 * replaced if the result is actually smaller. Both .image-output/ and .image-backup/ are gitignored.
 */
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, extname } from 'node:path'
import sharp from 'sharp'

// Windows: sharp/libvips keeps files it reads open (and caches them), which blocks overwriting the
// same file in --replace mode. Disable the cache and always feed sharp an in-memory buffer.
sharp.cache(false)

const ROOT = process.cwd()
const IMAGES = join(ROOT, 'public', 'images')
const OUTPUT = join(ROOT, '.image-output')
const BACKUP = join(ROOT, '.image-backup')

/** Target box per folder (matches public/images/IMAGE_BRIEF.md). */
const TARGETS = {
  cases: { width: 1600, height: 900 },
  evidence: { width: 1200, height: 900 },
  cryptids: { width: 1000, height: 1250 },
}
const BUDGET_BYTES = 300 * 1024
const QUALITY_STEPS = [78, 70, 62, 55]

const args = process.argv.slice(2)
const replace = args.includes('--replace')
const folderArg = args.includes('--folder') ? args[args.indexOf('--folder') + 1] : undefined
const folders = args.includes('--all') ? Object.keys(TARGETS) : [folderArg ?? 'evidence']

for (const f of folders) {
  if (!(f in TARGETS)) {
    console.error(`Unknown folder "${f}". Use one of: ${Object.keys(TARGETS).join(', ')}`)
    process.exit(1)
  }
}

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`

async function encode(input, { width, height }) {
  let best = null
  for (const quality of QUALITY_STEPS) {
    const buffer = await sharp(input)
      .rotate()
      .resize({ width, height, fit: 'inside', withoutEnlargement: true })
      .webp({ quality, effort: 6 })
      .toBuffer()
    best = { buffer, quality }
    if (buffer.length <= BUDGET_BYTES) break
  }
  return best
}

let totalBefore = 0
let totalAfter = 0
const rows = []

for (const folder of folders) {
  const dir = join(IMAGES, folder)
  if (!existsSync(dir)) continue
  const files = (await readdir(dir)).filter((name) => extname(name).toLowerCase() === '.webp')
  const outDir = replace ? dir : join(OUTPUT, folder)
  await mkdir(outDir, { recursive: true })
  if (replace) await mkdir(join(BACKUP, folder), { recursive: true })

  for (const name of files) {
    const source = join(dir, name)
    const before = (await stat(source)).size
    const input = await readFile(source)
    const { buffer, quality } = await encode(input, TARGETS[folder])
    const meta = await sharp(buffer).metadata()
    const smaller = buffer.length < before
    if (smaller) {
      if (replace) {
        const backupPath = join(BACKUP, folder, name)
        // Keep the very first original; never overwrite an existing backup.
        if (!existsSync(backupPath)) await copyFile(source, backupPath)
      }
      await writeFile(join(outDir, name), buffer)
    } else if (!replace) {
      await copyFile(source, join(outDir, name))
    }
    const after = smaller ? buffer.length : before
    totalBefore += before
    totalAfter += after
    rows.push({
      file: `${folder}/${name}`,
      before: kb(before),
      after: kb(after),
      size: `${meta.width}x${meta.height}`,
      quality: smaller ? quality : 'kept original',
    })
  }
}

console.table(rows)
console.log(`Total: ${kb(totalBefore)} -> ${kb(totalAfter)}`)
console.log(
  replace
    ? `Replaced in public/images. Originals backed up in .image-backup/.`
    : `Preview written to .image-output/. Check them, then run: npm run images:compress -- --replace`,
)