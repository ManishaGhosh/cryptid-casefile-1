import type { StateCreator } from 'zustand'
import type { CaseStatus } from '@/types/progress'

export interface CaseSlice {
  caseStatuses: Record<string, CaseStatus>
  setCaseStatus: (caseId: string, status: CaseStatus) => void
  resetAllCases: () => void
}

export const createCaseSlice: StateCreator<CaseSlice, [], [], CaseSlice> = (set) => ({
  caseStatuses: {},
  setCaseStatus: (caseId, status) =>
    set((state) => ({
      caseStatuses: { ...state.caseStatuses, [caseId]: status },
    })),
  resetAllCases: () => set({ caseStatuses: {} }),
})
