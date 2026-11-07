import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { resetAllProgress } from '@/services/resetProgress'
import ProgressResetModal from '@/components/ui/ProgressResetModal'
import {
  Shield,
  Folder,
  Eye,
  Lock,
  AlertTriangle,
  ChevronRight,
  RotateCcw,
  BookOpen,
  Activity,
  FileSearch,
} from 'lucide-react'
import { useAppStore } from '@/store'
import { CASES } from '@/data/cases'
import { CRYPTIDS } from '@/data/cryptids'
import { EVIDENCE } from '@/data/evidence'
import { cn } from '@/utils/cn'
import type { CaseStatus } from '@/types/progress'
import { classificationLabel, classificationStampTone } from '@/components/ui/ClassificationBadge'
import StatusLight from '@/components/ui/StatusLight'
import CaseStatusBadge from '@/components/ui/StatusBadge'
import Stamp from '@/components/ui/Stamp'
import Panel from '@/components/ui/Panel'
import Button, { buttonClasses } from '@/components/ui/Button'

// ── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        'texture-grain flex flex-col gap-2 rounded-sm border p-4',
        accent ? 'border-gold-dark/40 bg-gold-dark/10' : 'border-gold-dark/30 bg-bureau-dark',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="type-label min-w-0 break-words">{label}</span>
        <Icon className={cn('h-4 w-4 flex-shrink-0', accent ? 'text-gold/70' : 'text-off-white/60')} aria-hidden="true" />
      </div>
      <div className={cn('type-title', accent ? 'text-gold' : 'text-off-white')}>{value}</div>
    </div>
  )
}

/** Small row used in the Operational Status panel. */
function StatusRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="type-label">{label}</span>
      {children}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function HQPage() {
  const [resetOpen, setResetOpen] = useState(false)
  const [purged, setPurged] = useState(false)
  const navigate = useNavigate()
  const { caseStatuses, collectedEvidence, unlockedCryptidIds } = useAppStore()

  useEffect(() => {
    if (!purged) return
    const t = setTimeout(() => setPurged(false), 5000)
    return () => clearTimeout(t)
  }, [purged])

  const closedCount = CASES.filter((c) => caseStatuses[c.id] === 'closed').length
  const activeCount = CASES.filter((c) =>
    ['in-progress', 'identified'].includes(caseStatuses[c.id] ?? ''),
  ).length
  const totalCollected = Object.values(collectedEvidence).reduce((sum, ids) => sum + ids.length, 0)
  const identifiedCount = unlockedCryptidIds.filter((id) => {
    const c = CRYPTIDS.find((cr) => cr.id === id)
    return c?.mvpStatus === 'playable'
  }).length

  const now = new Date()
  const dateStr = now
    .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    .toUpperCase()
  const timeStr =
    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) +
    ' LOCAL'

  function handleReset() {
    resetAllProgress()
    setResetOpen(false)
    navigate('/', { replace: true })
    setPurged(true)
  }

  const remainingCount = CASES.length - closedCount
  const welcomeMessage =
    remainingCount === 0 ? (
      <>Welcome back, Investigator. All case files are closed.</>
    ) : activeCount > 0 ? (
      <>
        Welcome back, Investigator. You have{' '}
        <span className="text-gold">
          {activeCount} case{activeCount === 1 ? '' : 's'} in progress
        </span>
        .
      </>
    ) : (
      <>
        Welcome back, Investigator.{' '}
        <span className="text-gold">
          {remainingCount} case{remainingCount === 1 ? '' : 's'} awaiting assignment
        </span>
        .
      </>
    )

  const recentActivity = [
    { time: '02:17', text: 'Thermal imaging analysis — Case 001' },
    { time: 'Yesterday', text: 'New incident report filed — Case 003' },
    { time: '3 days ago', text: 'Sonar data received — Case 002' },
    { time: '5 days ago', text: 'Bureau HQ operational' },
  ]

  return (
    <div className="min-h-app">
      {/* Classification banner */}
      <div className="flex items-center justify-between gap-4 border-b border-blood-dark/30 bg-blood-dark/10 px-4 py-1.5 sm:px-6">
        <span className="type-label min-w-0 break-words text-blood-text">
          ⚠ CLASSIFIED MATERIALS — AUTHORISED PERSONNEL ONLY — FBCI INTERNAL NETWORK
        </span>
        <span className="type-label hidden flex-shrink-0 xl:inline">
          {dateStr} / {timeStr}
        </span>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Page header */}
        <div className="mb-8 flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="type-label mb-2 break-words text-gold/80">FEDERAL BUREAU OF CRYPTID INVESTIGATION</div>
            <h1 className="type-display mb-2 text-off-white">Bureau Headquarters</h1>
            <p className="type-body text-off-white/70">{welcomeMessage}</p>
          </div>
          <div className="hidden flex-col items-end gap-1.5 lg:flex">
            <div className="type-label rounded-sm border border-blood-dark/50 bg-blood-dark/10 px-3 py-1.5 text-blood-text">
              ████ TOP SECRET ████
            </div>
            <div className="type-label">CLEARANCE: OMEGA / ACCESS: UNRESTRICTED</div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Cases Active" value={activeCount} icon={FileSearch} accent={activeCount > 0} />
          <StatCard label="Cases Closed" value={`${closedCount}/${CASES.length}`} icon={Folder} />
          <StatCard label="Evidence Logged" value={`${totalCollected}/${EVIDENCE.length}`} icon={Eye} />
          <StatCard label="Cryptids ID'd" value={`${identifiedCount}/3`} icon={Shield} accent={identifiedCount > 0} />
        </div>

        {/* Main grid: cases + sidebar. Three columns only from xl (1280px): at lg the fixed sidebar
            leaves ~720px, which is too narrow for a 2/3-width case column plus a side rail. */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Case files — takes 2 columns */}
          <div className="min-w-0 space-y-6 xl:col-span-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="type-title text-off-white/90">Active Case Files</h2>
              <span className="type-label">{CASES.length} CASES ON FILE</span>
            </div>

            {CASES.map((caseItem) => {
              const status: CaseStatus = caseStatuses[caseItem.id] ?? 'new'
              const collected = collectedEvidence[caseItem.id]?.length ?? 0
              const total = caseItem.evidenceIds.length
              const closed = status === 'closed'
              const threatLevel =
                caseItem.classification === 'LEVEL 5 — EYES ONLY'
                  ? 5
                  : caseItem.classification === 'LEVEL 4 — CONFIDENTIAL'
                    ? 4
                    : caseItem.classification === 'LEVEL 3 — RESTRICTED'
                      ? 3
                      : 2

              return (
                /* Dossier folder: reference tab on the top edge, manila spine, paper sheet peeking below. */
                <article
                  key={caseItem.id}
                  className={cn(
                    'group transition-transform duration-150 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
                    // 90%: dimmed enough to read as filed away, but body text stays >= 4.5:1.
                    closed && 'opacity-90',
                  )}
                >
                  <div className="flex items-end pl-4">
                    <span
                      className={cn(
                        'type-label relative z-10 -mb-px rounded-t-sm border border-b-0 bg-bureau-dark px-3 py-1 transition-colors',
                        closed
                          ? 'border-off-white/15'
                          : 'border-gold-dark/30 text-gold/80 group-hover:border-gold-dark/60',
                      )}
                    >
                      {caseItem.id.toUpperCase()}
                    </span>
                  </div>

                  <div
                    className={cn(
                      'texture-grain relative overflow-hidden rounded-sm border transition-colors',
                      closed
                        ? 'border-off-white/15 bg-bureau-dark/60'
                        : 'border-gold-dark/30 bg-bureau-dark group-hover:border-gold-dark/60',
                    )}
                  >
                    {/* Manila spine */}
                    <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-parchment-dark/30" />

                    {/* Card header */}
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-gold-dark/20 py-3 pl-7 pr-5">
                      <CaseStatusBadge status={status} />
                      <Stamp
                        tone={classificationStampTone(caseItem.classification)}
                        surface="dark"
                        size="sm"
                        rotate={-4}
                        label={`Classification: ${caseItem.classification}`}
                      >
                        {classificationLabel(caseItem.classification)}
                      </Stamp>
                    </div>

                    {/* Card body */}
                    <div className="py-5 pl-7 pr-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="type-title mb-1 break-words text-off-white transition-colors group-hover:text-gold">
                            {caseItem.title}
                          </h3>
                          <div className="type-label mb-3 break-words">
                            {caseItem.location.toUpperCase()} · {caseItem.incidentDate.toUpperCase()}
                          </div>
                          <p className="type-body-sm line-clamp-2 text-off-white/70">
                            {caseItem.narrative.slice(0, 140)}…
                          </p>
                        </div>

                        {/* Threat level */}
                        <div className="flex flex-shrink-0 flex-col items-center gap-1">
                          <span className="type-label">THREAT</span>
                          <div className="flex flex-col gap-0.5">
                            {[5, 4, 3, 2, 1].map((lvl) => (
                              <div
                                key={lvl}
                                className={cn(
                                  'h-1.5 w-3 rounded-sm',
                                  lvl <= threatLevel
                                    ? lvl >= 5
                                      ? 'bg-blood-light'
                                      : lvl >= 4
                                        ? 'bg-blood'
                                        : lvl >= 3
                                          ? 'bg-gold'
                                          : 'bg-forest-light'
                                    : 'bg-off-white/10',
                                )}
                              />
                            ))}
                          </div>
                          <span className="type-meta text-off-white/60">{threatLevel}/5</span>
                        </div>
                      </div>

                      {/* Evidence progress + action */}
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                        <div className="min-w-[8rem] flex-1">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="type-label">EVIDENCE</span>
                            <span className="type-meta text-off-white/60">
                              {collected}/{total}
                            </span>
                          </div>
                          <div className="h-1 overflow-hidden rounded-full bg-off-white/10">
                            <div
                              className="h-full rounded-full bg-gold-dark/70 transition-all"
                              style={{ width: total > 0 ? `${(collected / total) * 100}%` : '0%' }}
                            />
                          </div>
                        </div>

                        <Link
                          to={`/case/${caseItem.id}`}
                          className={buttonClasses({ variant: closed ? 'ghost' : 'secondary', size: 'sm', className: 'flex-shrink-0' })}
                        >
                          <span>{closed ? 'VIEW FILE' : 'OPEN FILE'}</span>
                          <ChevronRight className="h-3 w-3" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </div>
                  {/* Paper sheet peeking out below the folder */}
                  <div
                    aria-hidden="true"
                    className="mx-2 h-1.5 rounded-b-sm border border-t-0 border-parchment-dark/20 bg-parchment-dark/20"
                  />
                </article>
              )
            })}
          </div>

          {/* Side rail: stacked at xl; two-up on tablet / lg so the panels do not stretch edge to edge. */}
          <div className="grid min-w-0 grid-cols-1 content-start gap-6 md:grid-cols-2 xl:grid-cols-1">
            {/* Cryptid Archive Preview */}
            <Panel eyebrow="SPECIMEN INDEX" reference="ARCH-01">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="type-heading text-off-white/90">Cryptid Archive</h3>
                <Link
                  to="/archive"
                  className="type-label focus-ring touch-target flex items-center gap-1 rounded-sm text-gold/80 transition-colors hover:text-gold"
                >
                  <BookOpen className="h-3 w-3" aria-hidden="true" />
                  VIEW ALL
                </Link>
              </div>

              <div className="space-y-2">
                {CRYPTIDS.map((cryptid) => {
                  const isUnlocked = unlockedCryptidIds.includes(cryptid.id)
                  const isArchiveOnly = cryptid.mvpStatus === 'archive-only'
                  return (
                    <div
                      key={cryptid.id}
                      className={cn(
                        'flex items-center gap-3 rounded-sm border p-2.5',
                        isUnlocked
                          ? 'border-forest-light/40 bg-forest-dark/20'
                          : isArchiveOnly
                            ? 'border-blood-dark/40 bg-bureau-black/40'
                            : 'border-off-white/10 bg-bureau-black/40',
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-sm',
                          isUnlocked ? 'bg-forest-dark/60' : 'bg-off-white/5',
                        )}
                      >
                        {isUnlocked ? (
                          <Eye className="h-3 w-3 text-off-white/80" aria-hidden="true" />
                        ) : (
                          <Lock
                            className={cn('h-3 w-3', isArchiveOnly ? 'text-blood-text' : 'text-off-white/60')}
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        {isUnlocked ? (
                          <>
                            <div title={cryptid.name} className="type-body-sm truncate text-off-white/90">
                              {cryptid.name}
                            </div>
                            <div title={cryptid.classification} className="type-label truncate">
                              {cryptid.classification}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className={cn('type-label mb-0.5 text-off-white/70', isArchiveOnly && 'text-blood-text')}>
                              {isArchiveOnly ? 'SEALED ENTRY' : 'UNIDENTIFIED SPECIMEN'}
                            </div>
                            <div className={cn('type-label', isArchiveOnly && 'text-blood-text')}>
                              {isArchiveOnly ? 'ARCHIVE ENTRY' : 'CLASSIFICATION PENDING'}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 border-t border-off-white/10 pt-3">
                <span className="type-label">{identifiedCount} OF 3 IDENTIFIABLE ENTITIES DISCOVERED</span>
              </div>
            </Panel>

            {/* Operational Status */}
            <Panel eyebrow="BUREAU STATUS" reference="OPS-01">
              <div className="mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-gold/70" aria-hidden="true" />
                <h3 className="type-heading text-off-white/90">Operational Status</h3>
              </div>

              <div className="mb-5 space-y-3">
                <StatusRow label="THREAT LEVEL">
                  <div
                    role="img"
                    aria-label={`Threat level ${closedCount === CASES.length ? 1 : activeCount > 0 ? 3 : 2} of 5`}
                    className="flex items-center gap-1"
                  >
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-2 w-2 rounded-full',
                          i <= (closedCount === CASES.length ? 1 : activeCount > 0 ? 3 : 2)
                            ? 'bg-gold-dark'
                            : 'bg-off-white/10',
                        )}
                      />
                    ))}
                  </div>
                </StatusRow>
                <StatusRow label="NETWORK">
                  <div className="flex items-center gap-2">
                    <StatusLight tone="green" flicker label="Network status: secure" />
                    <span className="type-label text-off-white/70">SECURE</span>
                  </div>
                </StatusRow>
                <StatusRow label="CLEARANCE">
                  <span className="type-label text-gold/80">OMEGA</span>
                </StatusRow>
              </div>

              {/* Recent activity */}
              <div className="border-t border-off-white/10 pt-3">
                <div className="type-label mb-2">RECENT ACTIVITY</div>
                <div className="space-y-2">
                  {recentActivity.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="type-meta w-24 flex-shrink-0 text-off-white/60">{item.time}</span>
                      <span className="type-meta text-off-white/70">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            {/* Alert + Reset */}
            <Panel tone="alert" eyebrow="DATA MANAGEMENT" className="md:col-span-2 xl:col-span-1">
              <div className="mb-4 flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blood-text" aria-hidden="true" />
                <p className="type-body-sm text-off-white/70">
                  Reset all investigation progress, collected evidence, and filed reports.
                </p>
              </div>
              <Button variant="danger" size="sm" icon={RotateCcw} className="w-full" onClick={() => setResetOpen(true)}>
                RESET ALL PROGRESS
              </Button>
              <div role="status" aria-live="polite">
                {purged && (
                  <p className="type-label mt-3 text-off-white/80">All investigation records purged.</p>
                )}
              </div>
            </Panel>
          </div>
        </div>
      </div>

      <ProgressResetModal
        open={resetOpen}
        onCancel={() => setResetOpen(false)}
        onConfirm={handleReset}
      />
    </div>
  )
}
