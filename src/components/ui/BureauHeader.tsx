import type { Ref } from 'react'
import { useLocation, useParams, Link } from 'react-router-dom'
import { Menu, UserRound } from 'lucide-react'
import { cn } from '@/utils/cn'

interface BreadcrumbItem {
  label: string
  href?: string
}

function getBreadcrumbs(pathname: string, caseId?: string): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [{ label: 'BUREAU HQ', href: '/' }]

  if (pathname === '/archive') {
    crumbs.push({ label: 'CRYPTID ARCHIVE' })
  } else if (caseId) {
    const caseLabel = 'CASE ' + caseId.toUpperCase().replace('CASE-', '')
    if (pathname.endsWith('/board')) {
      crumbs.push({ label: caseLabel, href: '/case/' + caseId })
      crumbs.push({ label: 'INVESTIGATION BOARD' })
    } else if (pathname.endsWith('/report')) {
      crumbs.push({ label: caseLabel, href: '/case/' + caseId })
      crumbs.push({ label: 'FILED REPORT' })
    } else {
      crumbs.push({ label: caseLabel })
    }
  }

  return crumbs
}

interface BureauHeaderProps {
  onMenuClick: () => void
  menuOpen: boolean
  /** Lets the layout return focus to the menu button when the drawer closes. */
  menuButtonRef?: Ref<HTMLButtonElement>
}

export default function BureauHeader({ onMenuClick, menuOpen, menuButtonRef }: BureauHeaderProps) {
  const location = useLocation()
  const { caseId } = useParams<{ caseId: string }>()
  const breadcrumbs = getBreadcrumbs(location.pathname, caseId)
  const lastIndex = breadcrumbs.length - 1

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 h-16 bg-bureau-dark/95 backdrop-blur border-b border-gold-dark/30">
      <div className="h-full flex items-center justify-between gap-3 px-3 sm:gap-4 sm:px-6">
        <div className="flex items-center gap-2 min-w-0 sm:gap-3">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={onMenuClick}
            className="focus-ring touch-target-icon -ml-1 inline-flex flex-shrink-0 items-center justify-center rounded-sm text-gold/80 hover:text-gold lg:hidden"
            aria-label="Open navigation"
            aria-expanded={menuOpen}
            aria-controls="bureau-sidebar"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>

          {/*
            Below md only the current page is shown (the full trail would be clipped); the sidebar
            and the in-page back links cover the parents. From md up the whole trail is shown and
            the current crumb truncates (full text in the tooltip) rather than overflowing.
          */}
          <nav className="flex min-w-0 items-center gap-1.5" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === lastIndex
              return (
                <span
                  key={crumb.label}
                  className={cn(
                    'items-center gap-1.5 whitespace-nowrap',
                    isLast ? 'flex min-w-0' : 'hidden flex-shrink-0 md:flex',
                  )}
                >
                  {i > 0 && (
                    <span className="hidden text-gold-dark/60 font-mono text-xs md:inline" aria-hidden="true">
                      /
                    </span>
                  )}
                  {crumb.href ? (
                    <Link
                      to={crumb.href}
                      className="type-label focus-ring touch-target inline-flex items-center rounded-sm text-gold/80 transition-colors hover:text-gold"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="type-label truncate text-off-white/90" title={crumb.label} aria-current="page">
                      {crumb.label}
                    </span>
                  )}
                </span>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="hidden xl:block text-right">
            <div className="type-label">FEDERAL BUREAU OF</div>
            <div className="type-label text-gold/80">CRYPTID INVESTIGATION</div>
          </div>
          <div className="hidden xl:block w-px h-8 bg-gold-dark/30" aria-hidden="true" />
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="font-serif text-sm text-off-white leading-tight">Investigator Hale</div>
              <div className="type-label mt-0.5 leading-tight">
                <span>BADGE 7714 / </span>
                <span className="text-blood-text">OMEGA</span>
              </div>
            </div>
            <div
              className="w-9 h-9 rounded-sm border border-gold-dark/60 bg-gold-dark/10 flex items-center justify-center"
              role="img"
              aria-label="Investigator profile: Investigator Hale, badge 7714"
            >
              <UserRound className="w-4 h-4 text-gold" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
