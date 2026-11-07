import { useMemo } from 'react'
import { useAppStore } from '@/store'
import { CRYPTIDS } from '@/data/cryptids'
import { CASES } from '@/data/cases'
import type { Cryptid } from '@/types/domain'

export interface ArchiveEntryModel {
  cryptid: Cryptid
  unlocked: boolean
  /** Archive-only: permanently sealed, never unlockable. */
  sealed: boolean
  linkedCaseId?: string
  reportFiledAt?: string
}

export interface ArchiveModel {
  entries: ArchiveEntryModel[]
  discoveredCount: number
  identifiableCount: number
}

export function useArchive(): ArchiveModel {
  const unlockedCryptidIds = useAppStore((s) => s.unlockedCryptidIds)
  const reports = useAppStore((s) => s.reports)

  return useMemo(() => {
    const entries: ArchiveEntryModel[] = CRYPTIDS.map((cryptid) => {
      const sealed = cryptid.mvpStatus === 'archive-only'
      const unlocked = !sealed && unlockedCryptidIds.includes(cryptid.id)
      const linkedCase = CASES.find((c) => c.correctCryptidId === cryptid.id)
      return {
        cryptid,
        unlocked,
        sealed,
        linkedCaseId: linkedCase?.id,
        reportFiledAt: linkedCase ? reports[linkedCase.id]?.filedAt : undefined,
      }
    })
    return {
      entries,
      discoveredCount: entries.filter((e) => e.unlocked).length,
      identifiableCount: CRYPTIDS.filter((c) => c.mvpStatus === 'playable').length,
    }
  }, [unlockedCryptidIds, reports])
}
