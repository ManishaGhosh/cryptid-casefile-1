import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import ReportDocument from '@/components/features/report/ReportDocument'
import { useAppStore } from '@/store'

function readJustFiled(state: unknown): boolean {
  return typeof state === 'object' && state !== null && (state as { justFiled?: unknown }).justFiled === true
}

export default function ReportPage() {
  const { caseId } = useParams<{ caseId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  // Read the router flag once so the entrance plays for this first view only.
  const [justFiled] = useState(() => readJustFiled(location.state))
  const report = useAppStore((s) => (caseId ? s.reports[caseId] : undefined))

  // Router state survives a browser refresh; clear it after reading so a reload never replays the animation.
  useEffect(() => {
    if (readJustFiled(location.state)) navigate(location.pathname, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Guard: no filed report for this case -> back to the case file.
  if (!report) return <Navigate to={`/case/${caseId ?? ''}`} replace />

  return (
    <div className="min-h-app p-4 md:p-8">
      <nav
        aria-label="Report navigation"
        className="type-label mx-auto mb-4 flex max-w-4xl justify-between"
      >
        <Link
          to={`/case/${report.caseId}`}
          className="focus-ring touch-target inline-flex items-center rounded-sm text-gold/80 transition-colors hover:text-gold"
        >
          ← Case file
        </Link>
        <Link
          to="/"
          className="focus-ring touch-target inline-flex items-center rounded-sm text-gold/80 transition-colors hover:text-gold"
        >
          Bureau HQ
        </Link>
      </nav>
      <ReportDocument report={report} justFiled={justFiled} />
    </div>
  )
}
