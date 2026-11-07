import { useState } from 'react'
import { useArchive } from '@/hooks/useArchive'
import CryptidGrid from '@/components/features/archive/CryptidGrid'
import DossierDetail from '@/components/features/archive/DossierDetail'

export default function ArchivePage() {
  const { entries, discoveredCount, identifiableCount } = useArchive()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = entries.find((e) => e.cryptid.id === selectedId && e.unlocked) ?? null
  const sealedCount = entries.filter((e) => e.sealed).length

  return (
    <div className="mx-auto min-h-app max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-8">
        <p className="type-label text-gold/80">FBCI RESTRICTED ARCHIVE</p>
        <h1 className="type-display mt-2 text-off-white">Cryptid Archive</h1>
        <p className="type-meta mt-3 text-off-white/70">
          {discoveredCount} of {identifiableCount} identifiable entities discovered
          <span aria-hidden="true"> · </span>
          {sealedCount} entries sealed
        </p>
        <p className="type-body-sm mt-2 max-w-2xl text-off-white/70">
          Dossiers open as field investigations conclude. Sealed entries remain closed to all personnel.
        </p>
      </header>

      <CryptidGrid entries={entries} onOpen={setSelectedId} />

      {selected && <DossierDetail entry={selected} onClose={() => setSelectedId(null)} />}
    </div>
  )
}
