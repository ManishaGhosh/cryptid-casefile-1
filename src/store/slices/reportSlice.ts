import type { StateCreator } from 'zustand'
import type { InvestigationReport } from '@/types/report'
import type { IdentificationResult } from '@/types/identification'

export interface ReportSlice {
  reports: Record<string, InvestigationReport>
  lastIdentificationResult: IdentificationResult | null
  fileReport: (report: InvestigationReport) => void
  setLastIdentificationResult: (result: IdentificationResult | null) => void
  resetAllReports: () => void
}

export const createReportSlice: StateCreator<ReportSlice, [], [], ReportSlice> = (set) => ({
  reports: {},
  lastIdentificationResult: null,
  fileReport: (report) =>
    set((state) => ({
      reports: { ...state.reports, [report.caseId]: report },
    })),
  setLastIdentificationResult: (result) => set({ lastIdentificationResult: result }),
  resetAllReports: () => set({ reports: {}, lastIdentificationResult: null }),
})
