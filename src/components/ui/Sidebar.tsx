import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { Shield, LayoutDashboard, FolderOpen, BookLock, BookOpen, X } from 'lucide-react'
import BureauImage from '@/components/ui/BureauImage'
import { CASES } from '@/data/cases'
import { BRAND_EMBLEM } from '@/data/images'
import { useAppStore } from '@/store'
import { cn } from '@/utils/cn'
import StatusLight, { type StatusLightTone } from '@/components/ui/StatusLight'
import type { CaseStatus } from '@/types/progress'

interface SidebarProps {
  /** Drawer state below `lg`. Ignored for visibility at `lg` and up, where the sidebar is permanent. */
  open: boolean
  /** True at `lg` and up: the sidebar is a permanent column, not a drawer. */
  isDesktop: boolean
  /** Close the drawer without navigating (close button, scrim, Escape). */
  onClose: () => void
  /** A navigation link was activated. */
  onNavigate: () => void
  /** The Field Manual button was activated: close the drawer (if any) and replay the briefing. */
  onFieldManual: () => void
}

/** Static case lights (only the "secure link" light flickers, to keep the nav calm). */
const STATUS_LIGHT: Record<CaseStatus, { tone: StatusLightTone; label: string }> = {
  new: { tone: 'off', label: 'Status: new' },
  'in-progress': { tone: 'gold', label: 'Status: in progress' },
  identified: { tone: 'green', label: 'Status: identified' },
  closed: { tone: 'off', label: 'Status: closed' },
}

// Active: gold left rule + gold text + faint gold-dark fill (aria-current="page" comes from NavLink).
const linkBase =
  'type-label focus-ring touch-target flex items-center gap-3 rounded-sm border-l-2 px-3 py-2 transition-colors'

function navClass({ isActive }: { isActive: boolean }): string {
  return cn(
    linkBase,
    isActive
      ? 'border-gold bg-gold-dark/10 text-gold'
      : 'border-transparent text-off-white/60 hover:bg-off-white/5 hover:text-off-white/80',
  )
}

const FOCUSABLE = 'a[href], button:not([disabled])'

export default function Sidebar({ open, isDesktop, onClose, onNavigate, onFieldManual }: SidebarProps) {
  const caseStatuses = useAppStore((s) => s.caseStatuses)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // The drawer is only "live" below lg while open. Otherwise (closed drawer) it must be
  // unreachable by keyboard and assistive tech, even though it is merely translated off-screen.
  const drawerOpen = open && !isDesktop
  const unreachable = !isDesktop && !open
  const hiddenProps: Record<string, string> = unreachable ? { inert: '', 'aria-hidden': 'true' } : {}

  // Move focus into the drawer on open; Escape closes; Tab stays inside while it is open.
  useEffect(() => {
    if (!drawerOpen) return
    closeRef.current?.focus()

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusables = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !panelRef.current.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [drawerOpen])

  return (
    <>
      {/* Mobile scrim */}
      <div
        data-testid="sidebar-scrim"
        className={cn(
          'fixed inset-0 z-30 bg-black/70 lg:hidden transition-opacity motion-reduce:transition-none',
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        id="bureau-sidebar"
        data-testid="sidebar"
        {...hiddenProps}
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 flex w-64 max-w-[85vw] flex-col',
          'bg-bureau-dark border-r border-gold-dark/30 texture-grain',
          'transition-[transform,visibility] duration-300 motion-reduce:transition-none lg:translate-x-0',
          drawerOpen ? 'translate-x-0' : '-translate-x-full max-lg:invisible',
        )}
      >
        {/* Brand */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-gold-dark/30">
          <div className="flex min-w-0 items-center gap-3">
            <BureauImage
              asset={BRAND_EMBLEM}
              aspect="1/1"
              decorative
              priority
              className="h-9 w-9 flex-shrink-0"
              imgClassName="object-contain"
              fallback={
                <div className="h-full w-full rounded-sm bg-gold-dark/15 border border-gold-dark/60 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-gold" aria-hidden="true" />
                </div>
              }
            />
            <div className="min-w-0">
              <div className="font-serif text-sm font-semibold text-off-white leading-tight">Cryptid Casefiles</div>
              <div className="type-label mt-0.5 truncate text-gold/80 leading-tight">F.B.C.I. FIELD TERMINAL</div>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="focus-ring touch-target-icon inline-flex flex-shrink-0 items-center justify-center rounded-sm text-off-white/60 hover:text-gold lg:hidden"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Nav */}
        <nav aria-label="Bureau navigation" className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          <div>
            <div className="type-label mb-2 px-3 tracking-[0.25em]">OPERATIONS</div>
            <NavLink to="/" end className={navClass} onClick={onNavigate}>
              <LayoutDashboard className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              BUREAU HQ
            </NavLink>
            <NavLink to="/archive" className={navClass} onClick={onNavigate}>
              <BookLock className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              CRYPTID ARCHIVE
            </NavLink>
            <button
              type="button"
              onClick={onFieldManual}
              className={cn(linkBase, 'w-full border-transparent text-left text-off-white/60 hover:bg-off-white/5 hover:text-off-white/80')}
            >
              <BookOpen className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              FIELD MANUAL
            </button>
          </div>

          <div>
            <div className="type-label mb-2 px-3 tracking-[0.25em]">CASE FILES</div>
            <div className="space-y-0.5">
              {CASES.map((c) => {
                const status: CaseStatus = caseStatuses[c.id] ?? 'new'
                const light = STATUS_LIGHT[status]
                return (
                  <NavLink key={c.id} to={'/case/' + c.id} className={navClass} onClick={onNavigate}>
                    <FolderOpen className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <span className="flex-1 min-w-0">
                      <span className="block truncate">{c.id.toUpperCase().replace('CASE-', 'CASE ')}</span>
                      <span
                        title={c.title}
                        className="block truncate font-sans text-xs normal-case tracking-normal text-off-white/60"
                      >
                        {c.title}
                      </span>
                    </span>
                    <StatusLight tone={light.tone} label={light.label} />
                  </NavLink>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gold-dark/20">
          <div className="flex items-center gap-2">
            {/* The visible text already names the state; the light itself is decorative. */}
            <span aria-hidden="true" className="inline-flex">
              <StatusLight tone="green" flicker label="" />
            </span>
            <span className="type-label text-off-white/70">SECURE LINK ESTABLISHED</span>
          </div>
          <div className="type-label mt-1">BUILD 1.0 / OFFLINE CAPABLE</div>
        </div>
      </div>
    </>
  )
}
