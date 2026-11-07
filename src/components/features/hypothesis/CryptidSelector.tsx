import { Check } from 'lucide-react'
import { CRYPTIDS } from '@/data/cryptids'
import { cn } from '@/utils/cn'

interface CryptidSelectorProps {
  selectedId: string | null
  onSelect: (id: string) => void
  unlockedIds: readonly string[]
  disabled?: boolean
}

/** Lists all cryptids by name regardless of unlock state, as file-tab radio cards. */
export default function CryptidSelector({
  selectedId,
  onSelect,
  unlockedIds,
  disabled = false,
}: CryptidSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Suspected entity" className="space-y-2">
      {CRYPTIDS.map((c) => {
        const selected = selectedId === c.id
        const onFile = unlockedIds.includes(c.id)
        return (
          <label
            key={c.id}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-sm border border-l-4 px-3 py-2.5 transition-colors',
              'focus-within:ring-2 focus-within:ring-gold',
              selected
                ? 'border-gold bg-gold-dark/10'
                : 'border-gold-dark/30 bg-bureau-black/40 hover:border-gold-dark/60',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            <input
              type="radio"
              name="suspected-entity"
              value={c.id}
              checked={selected}
              disabled={disabled}
              onChange={() => onSelect(c.id)}
              className="sr-only"
            />
            {/* Visual check box; the native radio above carries the semantics. */}
            <span
              aria-hidden="true"
              className={cn(
                'mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm border',
                selected ? 'border-gold bg-gold text-near-black' : 'border-off-white/50',
              )}
            >
              {selected && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            <span className="min-w-0 flex-1 break-words">
              <span className="type-heading block text-off-white">{c.name}</span>
              <span className="type-label block">{c.classification}</span>
            </span>
            {onFile && (
              <span className="type-label rounded-sm bg-forest-dark px-1.5 py-0.5 text-off-white">ON FILE</span>
            )}
          </label>
        )
      })}
    </div>
  )
}
