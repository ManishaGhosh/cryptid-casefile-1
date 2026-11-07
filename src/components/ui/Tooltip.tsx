import { cloneElement, useId, useState, type ReactElement } from 'react'
import { cn } from '@/utils/cn'

interface TooltipProps {
  content: string
  /** Single element; receives aria-describedby. */
  children: ReactElement<{ 'aria-describedby'?: string }>
  className?: string
}

/** Shows content on hover and keyboard focus. Wrap disabled buttons in a focusable span. */
export default function Tooltip({ content, children, className }: TooltipProps) {
  const id = useId()
  const [open, setOpen] = useState(false)

  return (
    <span
      className={cn('relative inline-block max-w-full', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false)
      }}
    >
      {cloneElement(children, { 'aria-describedby': id })}
      <span
        id={id}
        role="tooltip"
        className={cn(
          'type-body-sm pointer-events-none absolute bottom-full left-0 z-20 mb-2 w-64 max-w-[calc(100vw-2rem)] rounded-sm border border-gold-dark/60 bg-bureau-black px-3 py-2 text-off-white',
          open ? 'block' : 'hidden',
        )}
      >
        {content}
      </span>
    </span>
  )
}
