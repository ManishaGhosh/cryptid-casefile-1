import { Link } from 'react-router-dom'
import { FileCheck } from 'lucide-react'
import { formatDate } from '@/utils/formatDate'
import { buttonClasses } from '@/components/ui/Button'
import type { InvestigationReport } from '@/types/report'

export default function FiledReportSummary({ report }: { report: InvestigationReport }) {
  return (
    <section
      aria-label="Filed report summary"
      className="texture-grain rounded-sm border border-forest-light/40 bg-forest-dark/20 p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <FileCheck className="h-4 w-4 text-off-white/80" aria-hidden="true" />
        <h3 className="type-label text-off-white/90">REPORT FILED</h3>
      </div>
      <dl className="space-y-3">
        <div>
          <dt className="type-label">IDENTIFIED ENTITY</dt>
          <dd className="type-heading text-off-white">{report.identifiedCryptidName}</dd>
        </div>
        <div>
          <dt className="type-label">CONFIDENCE</dt>
          <dd className="type-meta text-gold">{report.confidenceScore}%</dd>
        </div>
        <div>
          <dt className="type-label">FILED</dt>
          <dd className="type-meta text-off-white/80">{formatDate(report.filedAt)}</dd>
        </div>
      </dl>
      <Link
        to={`/case/${report.caseId}/report`}
        className={buttonClasses({ variant: 'secondary', size: 'sm', className: 'mt-5 w-full' })}
      >
        VIEW FILED REPORT
      </Link>
    </section>
  )
}
