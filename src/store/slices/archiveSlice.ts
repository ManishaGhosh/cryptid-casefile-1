import type { StateCreator } from 'zustand'

export interface ArchiveSlice {
  unlockedCryptidIds: string[]
  unlockCryptid: (cryptidId: string) => void
  resetArchive: () => void
}

export const createArchiveSlice: StateCreator<ArchiveSlice, [], [], ArchiveSlice> = (set) => ({
  unlockedCryptidIds: [],
  unlockCryptid: (cryptidId) =>
    set((state) => {
      if (state.unlockedCryptidIds.includes(cryptidId)) return state
      return { unlockedCryptidIds: [...state.unlockedCryptidIds, cryptidId] }
    }),
  resetArchive: () => set({ unlockedCryptidIds: [] }),
})
