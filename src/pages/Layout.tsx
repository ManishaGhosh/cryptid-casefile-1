import { useEffect, useRef, useState } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import BureauHeader from '@/components/ui/BureauHeader'
import Sidebar from '@/components/ui/Sidebar'
import OrientationBriefing from '@/components/features/onboarding/OrientationBriefing'
import { useOnboarding } from '@/hooks/useOnboarding'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { pageVariants } from '@/utils/motion'

/** Matches Tailwind's `lg` breakpoint: the sidebar is a permanent column from here up. */
const DESKTOP_QUERY = '(min-width: 1024px)'

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const mainRef = useRef<HTMLElement>(null)
  const location = useLocation()
  const outlet = useOutlet()
  const reduced = useReducedMotion() ?? false

  /** Close the drawer and hand focus back to the button that opened it. */
  const closeToMenuButton = (): void => {
    setMenuOpen(false)
    menuButtonRef.current?.focus()
  }

  /** A nav link was chosen: close the drawer; on small screens move focus to the new page. */
  const handleNavigate = (): void => {
    setMenuOpen(false)
    if (!isDesktop) mainRef.current?.focus()
  }

  /** Replay the briefing from step 1. Stays on the current route; the drawer closes first. */
  const handleFieldManual = (): void => {
    setMenuOpen(false)
    useOnboarding.getState().openBriefing()
  }

  // First visit only: the "seen" flag is set when the briefing is closed (skip or complete).
  useEffect(() => {
    useOnboarding.getState().autoOpenIfFirstRun()
  }, [])

  return (
    <div className="min-h-app overflow-x-clip bg-bureau-black text-off-white">
      <a
        href="#main-content"
        onClick={(e) => {
          // Router-safe: focus the landmark without rewriting the URL hash.
          e.preventDefault()
          mainRef.current?.focus()
        }}
        className="type-label focus-ring sr-only text-gold focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-sm focus:border focus:border-gold focus:bg-bureau-black focus:px-4 focus:py-3"
      >
        Skip to main content
      </a>
      <Sidebar
        open={menuOpen}
        isDesktop={isDesktop}
        onClose={closeToMenuButton}
        onNavigate={handleNavigate}
        onFieldManual={handleFieldManual}
      />
      <BureauHeader
        menuOpen={menuOpen}
        onMenuClick={() => setMenuOpen(true)}
        menuButtonRef={menuButtonRef}
      />
      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="atmosphere min-h-app pt-16 focus:outline-none lg:pl-64"
      >
        <AnimatePresence mode="wait" initial={false}>
          {/* Framer clears the transform once `y` settles at 0, so fixed children are unaffected. */}
          <motion.div
            key={location.pathname}
            variants={pageVariants(reduced)}
            initial="initial"
            animate="enter"
            exit="exit"
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>
      <OrientationBriefing />
    </div>
  )
}
