import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { useHydration } from '@/hooks/useHydration'
import BureauImage from '@/components/ui/BureauImage'
import { BRAND_EMBLEM } from '@/data/images'

export default function App() {
  const hydrated = useHydration()

  if (!hydrated) {
    return (
      <div className="atmosphere flex min-h-app items-center justify-center bg-bureau-black p-4">
        <div
          role="status"
          aria-live="polite"
          className="texture-paper relative w-full max-w-sm overflow-hidden rounded-sm border border-gold-dark bg-parchment px-8 py-6 text-near-black shadow-sheet"
        >
          <BureauImage
            asset={BRAND_EMBLEM}
            aspect="1/1"
            decorative
            priority
            fallback={null}
            className="absolute right-4 top-4 w-12"
            imgClassName="object-contain"
          />
          <p className="type-label text-near-black/70">F.B.C.I. FIELD TERMINAL</p>
          <p className="typewriter-dots mt-3 font-mono text-sm uppercase tracking-widest">
            Retrieving case files
          </p>
          {/* Thin scan bar sliding along a track (static under reduced motion). */}
          <div className="mt-4 h-px w-full overflow-hidden bg-near-black/20" aria-hidden="true">
            <div className="loading-scan h-full w-1/4 bg-gold-dark" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <RouterProvider
      router={router}
      fallbackElement={
        <div className="atmosphere flex min-h-app items-center justify-center bg-bureau-black p-4">
          <p role="status" className="typewriter-dots font-mono text-sm uppercase tracking-widest text-off-white">
            Retrieving board
          </p>
        </div>
      }
    />
  )
}
