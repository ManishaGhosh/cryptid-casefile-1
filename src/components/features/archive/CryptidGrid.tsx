import CryptidEntry from './CryptidEntry'
import type { ArchiveEntryModel } from '@/hooks/useArchive'

interface CryptidGridProps {
  entries: ArchiveEntryModel[]
  onOpen: (cryptidId: string) => void
}

export default function CryptidGrid({ entries, onOpen }: CryptidGridProps) {
  if (entries.length === 0) {
    return <p className="type-label">NO ARCHIVE ENTRIES AVAILABLE.</p>
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {entries.map((entry) => (
        <CryptidEntry key={entry.cryptid.id} entry={entry} onOpen={onOpen} />
      ))}
    </div>
  )
}
