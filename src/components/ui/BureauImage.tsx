import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'
import type { ImageAsset } from '@/data/images'
import { cn } from '@/utils/cn'

export type BureauImageAspect = '16/9' | '4/3' | '4/5' | '1/1'
export type BureauImageTreatment = 'photo' | 'plate' | 'none'

export interface BureauImageProps {
  /** `null` renders only the fallback and never an `<img>` (locked, sealed, unknown, archive-only). */
  asset: ImageAsset | null
  /**
   * Shown underneath the image and whenever the image is absent, loading, or broken.
   * Pass `null` for "no placeholder": the slot then takes no space until the image has loaded.
   */
  fallback: ReactNode
  aspect: BureauImageAspect
  /** Applied to the outer frame: sizing, margins, rotation, an explicit height that overrides the aspect ratio. */
  className?: string
  /** Applied to the `<img>` (e.g. `object-[center_30%]`). */
  imgClassName?: string
  /** Applied to the outer frame only once the image has loaded (use for margins on no-placeholder slots). */
  loadedClassName?: string
  /** Decorative images get `alt=""` and `aria-hidden`. */
  decorative?: boolean
  /** Above-the-fold images load eagerly. Everything else is lazy. */
  priority?: boolean
  treatment?: BureauImageTreatment
  /** Called whenever the load state changes (including the initial `loading`). Never called when `asset` is null. */
  onStateChange?: (state: 'loading' | 'loaded' | 'failed') => void
}

// Full class strings so Tailwind can see them.
const ASPECT_CLASS: Record<BureauImageAspect, string> = {
  '16/9': 'aspect-[16/9]',
  '4/3': 'aspect-[4/3]',
  '4/5': 'aspect-[4/5]',
  '1/1': 'aspect-square',
}

type Status = 'loading' | 'loaded' | 'failed'

/** Subtle archival tone: slightly desaturated with a hint of sepia. */
const PHOTO_FILTER = 'saturate(0.85) sepia(0.15)'

function PhotoCorners() {
  const corner = 'pointer-events-none absolute h-3 w-3 border-near-black/50'
  return (
    <>
      <span aria-hidden="true" className={cn(corner, 'left-0 top-0 border-l border-t')} />
      <span aria-hidden="true" className={cn(corner, 'right-0 top-0 border-r border-t')} />
      <span aria-hidden="true" className={cn(corner, 'bottom-0 left-0 border-b border-l')} />
      <span aria-hidden="true" className={cn(corner, 'bottom-0 right-0 border-b border-r')} />
    </>
  )
}

interface SlotProps extends Omit<BureauImageProps, 'asset'> {
  asset: ImageAsset
}

function ImageSlot({
  asset,
  fallback,
  aspect,
  className,
  imgClassName,
  loadedClassName,
  decorative = false,
  priority = false,
  treatment = 'none',
  onStateChange,
}: SlotProps) {
  const reduceMotion = useReducedMotion() ?? false
  const imgRef = useRef<HTMLImageElement>(null)
  const [status, setStatus] = useState<Status>('loading')
  const onStateChangeRef = useRef(onStateChange)
  onStateChangeRef.current = onStateChange

  useEffect(() => {
    onStateChangeRef.current?.(status)
  }, [status])

  // An already-cached image can finish before React attaches `onLoad`.
  useEffect(() => {
    const img = imgRef.current
    if (img && img.complete && img.naturalWidth > 0) setStatus('loaded')
  }, [])

  const hasFallback = fallback !== null && fallback !== undefined && fallback !== false
  const loaded = status === 'loaded'
  // No-placeholder slots take no space (and no frame) until their image has actually loaded.
  const collapsed = !hasFallback && !loaded

  return (
    <div
      data-image-state={status}
      className={cn(
        'relative w-full',
        !collapsed && treatment === 'photo' && 'border border-parchment-dark bg-parchment p-1.5 shadow-paper',
        !collapsed && treatment === 'plate' && 'plate rounded-sm border border-near-black/50',
        className,
        loaded && loadedClassName,
      )}
    >
      <div className={cn('relative w-full overflow-hidden', collapsed ? 'h-0' : cn('h-full', ASPECT_CLASS[aspect]))}>
        {hasFallback && (
          <div
            aria-hidden={loaded || undefined}
            className={cn(
              'absolute inset-0 flex',
              loaded && 'pointer-events-none opacity-0',
              !reduceMotion && 'transition-opacity duration-200',
            )}
          >
            {fallback}
          </div>
        )}
        {status !== 'failed' && (
          <img
            ref={imgRef}
            src={asset.src}
            alt={decorative ? '' : asset.alt}
            aria-hidden={decorative || undefined}
            width={asset.width}
            height={asset.height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={() => setStatus('loaded')}
            onError={() => setStatus('failed')}
            style={treatment === 'photo' ? { filter: PHOTO_FILTER } : undefined}
            className={cn(
              'absolute inset-0 h-full w-full object-cover',
              loaded ? 'opacity-100' : 'opacity-0',
              !reduceMotion && 'transition-opacity duration-200',
              imgClassName,
            )}
          />
        )}
      </div>
      {!collapsed && treatment === 'photo' && <PhotoCorners />}
    </div>
  )
}

/**
 * Image slot with a graceful fallback. The fallback is the whole experience until (and unless) the image
 * loads; a missing or broken file leaves it in place with no broken-image icon.
 */
export default function BureauImage(props: BureauImageProps) {
  const { asset, fallback } = props
  if (!asset) return <>{fallback}</>
  // Keyed by source so a changed asset starts over in the `loading` state.
  return <ImageSlot key={asset.src} {...props} asset={asset} />
}
