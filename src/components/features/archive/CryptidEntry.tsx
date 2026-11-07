import { useEffect, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Lock, FolderOpen } from 'lucide-react'
import RedactedOverlay from '@/components/ui/RedactedOverlay'
import ScanOverlay from '@/components/ui/ScanOverlay'
import Stamp from '@/components/ui/Stamp'
import BureauImage from '@/components/ui/BureauImage'
import { getCryptidImage, type ImageAsset } from '@/data/images'
import { cn } from '@/utils/cn'
import { hasSeenReveal, markRevealSeen } from '@/services/revealMemory'
import type { ArchiveEntryModel } from '@/hooks/useArchive'

interface CryptidEntryProps {
  entry: ArchiveEntryModel
  onOpen: (cryptidId: string) => void
}

/** Total length of the one-time discovery reveal. */
const REVEAL_MS = 1200

/** Framed measurement plate (CSS-only; see `.plate` in index.css). `tint` lays a red wash over it. */
function SpecimenPlate({
  caption,
  tint = false,
  image = null,
  children,
}: {
  caption: string
  tint?: boolean
  /** Only ever passed for unlocked entries; the plate is the fallback when it is null or fails to load. */
  image?: ImageAsset | null
  children?: ReactNode
}) {
  const [imageLoaded, setImageLoaded] = useState(false)
  return (
    <div
      aria-hidden={image ? undefined : 'true'}
      data-plate-shape={imageLoaded ? 'portrait-crop' : 'strip'}
      className={cn(
        'plate relative overflow-hidden rounded-sm border border-near-black/50',
        imageLoaded ? 'aspect-[4/3]' : 'h-28',
      )}
    >
      {image && (
        <BureauImage
          asset={image}
          aspect="4/5"
          className="absolute inset-0 h-full"
          imgClassName="object-cover object-[center_30%]"
          fallback={<span aria-hidden="true" />}
          onStateChange={(s) => setImageLoaded(s === 'loaded')}
        />
      )}
      {tint && <span className="absolute inset-0 bg-blood-dark/25" />}
      <span className={cn('type-label absolute bottom-1.5 right-2 text-gold/80', image && 'bg-bureau-black/70 px-1')}>
        {caption}
      </span>
      {children}
    </div>
  )
}
export default function CryptidEntry({ entry, onOpen }: CryptidEntryProps) {
  const reduce = useReducedMotion() ?? false
  const { cryptid, unlocked, sealed } = entry
  const number = cryptid.id.replace('cryptid-', '')
  const specimenNumber = `SPECIMEN ${number}`
  // Decided once per mount: archive-only entries never reveal; reduced motion skips straight to done.
  const [revealing, setRevealing] = useState(() => unlocked && !sealed && !reduce && !hasSeenReveal(cryptid.id))
  const motionProps = reduce
    ? {}
    : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }

  useEffect(() => {
    if (!unlocked || sealed) return
    // Remember immediately so a remount (or reload) never replays the reveal.
    markRevealSeen(cryptid.id)
    if (!revealing) return
    const t = setTimeout(() => setRevealing(false), REVEAL_MS)
    return () => clearTimeout(t)
  }, [unlocked, sealed, cryptid.id, revealing])

  if (unlocked) {
    return (
      <motion.div {...motionProps} className="h-full">
        <div className="relative h-full" data-reveal={revealing ? 'pending' : 'done'}>
          <button
            type="button"
            aria-label={`Open dossier: ${cryptid.name}`}
            onClick={() => onOpen(cryptid.id)}
            className="focus-ring group texture-paper relative h-full w-full rounded-sm border border-parchment-dark bg-parchment-light p-4 text-left text-near-black shadow-paper transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-gold-dark motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <span className="mb-3 flex items-center justify-between gap-2">
              <span className="type-label text-near-black/70">{specimenNumber}</span>
              <span className="type-label rounded-sm bg-forest-dark px-2 py-0.5 text-off-white">ON FILE</span>
            </span>
            <SpecimenPlate caption={`PLATE ${number}`} image={getCryptidImage(cryptid.id)} />
            <span className="relative mt-3 block">
              <motion.span
                className="type-title block text-near-black"
                initial={revealing ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.45 }}
              >
                {cryptid.name}
              </motion.span>
              {revealing && (
                <motion.span
                  aria-hidden="true"
                  data-testid="sealed-band"
                  className="sealed-band type-label pointer-events-none absolute inset-0 flex items-center justify-center text-off-white/70"
                  initial={{ clipPath: 'inset(0 0 0 0%)' }}
                  animate={{ clipPath: 'inset(0 0 0 100%)' }}
                  transition={{ duration: 0.2, delay: 0.2, ease: 'easeOut' }}
                >
                  DECLASSIFYING…
                </motion.span>
              )}
            </span>
            <span className="type-label mt-1 block text-near-black/70">{cryptid.classification}</span>
            <span className="type-body-sm mt-3 block break-words text-near-black/80">{cryptid.signatureTraits[0]}</span>
            <span className="type-label mt-4 inline-flex items-center gap-1.5 text-forest-dark">
              <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
              Open dossier
            </span>
          </button>          {revealing && (
            <div
              aria-hidden="true"
              data-testid="reveal-layer"
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-sm"
            >
              <ScanOverlay active durationMs={500} />
              <div className="absolute bottom-3 right-3">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.01, delay: 0.6 }}
                >
                  <Stamp tone="green" size="sm" rotate={-8} animate>
                    SPECIMEN CATALOGUED
                  </Stamp>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  const status = sealed
    ? 'SEALED BY BUREAU DIRECTIVE — NO ACTIVE INVESTIGATION'
    : 'CLASSIFICATION PENDING — identify via field investigation'

  return (
    <motion.div {...motionProps} className="h-full">
      <article
        aria-label="Locked dossier"
        data-reveal="none"
        className="texture-grain h-full rounded-sm border border-blood-dark bg-bureau-dark p-4 text-off-white"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="type-label">{specimenNumber}</span>
          <span className="flex items-center gap-2">
            <span className="type-label rounded-sm bg-blood-dark px-2 py-0.5 text-off-white">LOCKED</span>
            <Lock className="h-4 w-4 text-off-white/60" aria-hidden="true" />
          </span>
        </div>
        {/* Plate under a red overlay: the specimen is withheld, not merely unidentified. */}
        <SpecimenPlate caption="WITHHELD" tint>
          <Stamp tone="red" surface="dark" size="sm" rotate={-8} className="absolute inset-0 m-auto h-fit w-fit">
            {sealed ? 'SEALED' : 'PENDING'}
          </Stamp>
        </SpecimenPlate>
        <p className="type-label mb-3 mt-3 break-words text-blood-text">{status}</p>
        <p className="type-label mb-3 text-off-white/70">{cryptid.classification}</p>
        <RedactedOverlay label={sealed ? 'SEALED' : 'REDACTED'} />
      </article>
    </motion.div>
  )
}