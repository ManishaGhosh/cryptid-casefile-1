import type { StateCreator } from 'zustand'

export interface EvidenceSlice {
  collectedEvidence: Record<string, string[]>
  observationNotes: Record<string, string>
  collectEvidence: (caseId: string, evidenceId: string) => void
  saveObservationNote: (evidenceId: string, note: string) => void
  resetAllEvidence: () => void
}

export const createEvidenceSlice: StateCreator<EvidenceSlice, [], [], EvidenceSlice> = (set) => ({
  collectedEvidence: {},
  observationNotes: {},
  collectEvidence: (caseId, evidenceId) =>
    set((state) => {
      const current = state.collectedEvidence[caseId] ?? []
      if (current.includes(evidenceId)) return state
      return {
        collectedEvidence: {
          ...state.collectedEvidence,
          [caseId]: [...current, evidenceId],
        },
      }
    }),
  saveObservationNote: (evidenceId, note) =>
    set((state) => ({
      observationNotes: { ...state.observationNotes, [evidenceId]: note },
    })),
  resetAllEvidence: () => set({ collectedEvidence: {}, observationNotes: {} }),
})
