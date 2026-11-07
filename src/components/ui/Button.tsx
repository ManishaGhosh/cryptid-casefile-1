/**
 * Button — the single button treatment for the app.
 *
 * Variants: primary (solid gold) | secondary (gold outline) | danger (blood outline) | ghost (quiet).
 * Sizes: sm | md. Always mono caps, rounded-sm, 1px border, shared `.focus-ring`.
 * `buttonClasses()` is exported so links (`<Link>`) and non-interactive "disabled link" spans can
 * share exactly the same look without wrapping a link in a button.
 */
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md'

const BASE =
  'focus-ring touch-target inline-flex items-center justify-center gap-2 rounded-sm border font-mono uppercase tracking-widest transition-colors ' +
  'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-60'

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'border-gold bg-gold font-semibold text-near-black hover:bg-gold-light disabled:hover:bg-gold',
  secondary:
    'border-gold-dark/60 bg-gold-dark/5 text-gold hover:border-gold hover:bg-gold-dark/15 disabled:hover:border-gold-dark/60 disabled:hover:bg-gold-dark/5',
  danger:
    'border-blood-light/60 bg-blood-dark/10 text-blood-text hover:border-blood-light hover:bg-blood-dark/30 hover:text-off-white',
  ghost: 'border-off-white/20 text-off-white/80 hover:border-off-white/50 hover:text-off-white',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-step-label',
  md: 'px-4 py-2 text-step-meta',
}

export function buttonClasses(opts: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}): string {
  const { variant = 'secondary', size = 'md', className } = opts
  return cn(BASE, VARIANT[variant], SIZE[size], className)
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Optional leading lucide icon (decorative, aria-hidden). */
  icon?: LucideIcon
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon: Icon, className, type = 'button', children, ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClasses({ variant, size, className })} {...rest}>
      {Icon && <Icon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />}
      {children}
    </button>
  )
})

export default Button
