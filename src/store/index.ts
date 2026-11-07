import { create } from 'zustand'
import { createCaseSlice, type CaseSlice } from './slices/caseSlice'
import { createEvidenceSlice, type EvidenceSlice } from './slices/evidenceSlice'
import { createBoardSlice, type BoardSlice } from './slices/boardSlice'
import { createArchiveSlice, type ArchiveSlice } from './slices/archiveSlice'
import { createReportSlice, type ReportSlice } from './slices/reportSlice'

import { attachPersistence } from './middleware/persistenceMiddleware'

export type AppStore = CaseSlice & EvidenceSlice & BoardSlice & ArchiveSlice & ReportSlice

export const useAppStore = create<AppStore>()((...a) => ({
  ...createCaseSlice(...a),
  ...createEvidenceSlice(...a),
  ...createBoardSlice(...a),
  ...createArchiveSlice(...a),
  ...createReportSlice(...a),
}))

attachPersistence(useAppStore)
