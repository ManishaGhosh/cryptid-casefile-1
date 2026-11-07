import { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import Button from '@/components/ui/Button'

interface ProgressResetModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function ProgressResetModal({ open, onCancel, onConfirm }: ProgressResetModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const onCancelRef = useRef(onCancel)
  onCancelRef.current = onCancel

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    cancelRef.current?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancelRef.current()
        return
      }
      if (e.key === 'Tab') {
        const first = cancelRef.current
        const last = confirmRef.current
        if (!first || !last) return
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-modal-title"
        aria-describedby="reset-modal-desc"
        className="texture-grain max-h-full w-full max-w-md overflow-y-auto rounded-sm border border-blood-dark bg-bureau-dark p-5 shadow-sheet sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-blood-text" aria-hidden="true" />
          <span className="type-label text-blood-text">IRREVERSIBLE ACTION</span>
        </div>
        <h2 id="reset-modal-title" className="type-title mb-2 text-off-white">
          Purge all investigation records?
        </h2>
        <p id="reset-modal-desc" className="type-body-sm mb-6 text-off-white/70">
          All collected evidence, board layouts, filed reports and archive unlocks will be
          permanently erased. This cannot be undone.
        </p>
        <div className="flex flex-wrap justify-end gap-3">
          <Button ref={cancelRef} variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            ref={confirmRef}
            variant="danger"
            onClick={onConfirm}
            className="border-blood-light bg-blood text-off-white hover:bg-blood-light"
          >
            Purge Records
          </Button>
        </div>
      </div>
    </div>
  )
}
