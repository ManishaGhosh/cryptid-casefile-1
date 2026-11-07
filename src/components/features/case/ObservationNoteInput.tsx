import { useEffect, useRef, useState } from 'react'
import { Check, Save } from 'lucide-react'
import { useAppStore } from '@/store'
import Button from '@/components/ui/Button'

export const OBSERVATION_MAX_LENGTH = 200

interface ObservationNoteInputProps {
  evidenceId: string
  draft: string
  onDraftChange: (value: string) => void
  disabled?: boolean
}

export default function ObservationNoteInput({
  evidenceId,
  draft,
  onDraftChange,
  disabled = false,
}: ObservationNoteInputProps) {
  const savedNote = useAppStore((s) => s.observationNotes[evidenceId] ?? '')
  const saveObservationNote = useAppStore((s) => s.saveObservationNote)
  const [justLogged, setJustLogged] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaId = `observation-${evidenceId}`

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  const unchanged = draft.trim() === savedNote
  const saveDisabled = disabled || unchanged

  const handleSave = () => {
    if (saveDisabled) return
    saveObservationNote(evidenceId, draft.trim())
    setJustLogged(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setJustLogged(false), 2000)
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={textareaId} className="type-label text-near-black/70">
        Investigator observation
      </label>
      <textarea
        id={textareaId}
        value={draft}
        maxLength={OBSERVATION_MAX_LENGTH}
        disabled={disabled}
        rows={4}
        onChange={(e) => onDraftChange(e.target.value.slice(0, OBSERVATION_MAX_LENGTH))}
        className="type-body-sm focus-ring-paper w-full resize-none rounded-sm border border-near-black/60 bg-parchment p-2 text-near-black disabled:opacity-60"
      />
      <div className="flex items-center justify-between gap-2">
        <span aria-live="polite" className="type-meta text-near-black/70">
          {draft.length}/{OBSERVATION_MAX_LENGTH}
        </span>
        <div className="flex items-center gap-3">
          <span role="status" className="type-meta text-forest-dark">
            {justLogged ? (
              <span className="inline-flex items-center gap-1">
                <Check size={14} aria-hidden="true" />
                Logged
              </span>
            ) : null}
          </span>
          <Button
            variant="secondary"
            size="sm"
            icon={Save}
            onClick={handleSave}
            disabled={saveDisabled}
            className="bg-bureau-dark hover:bg-bureau-black"
          >
            Log Observation
          </Button>
        </div>
      </div>
    </div>
  )
}
