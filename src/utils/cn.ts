import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Teach tailwind-merge about the semantic type steps (see tailwind.config.ts `fontSize`),
// otherwise `text-step-label` is mistaken for a colour and clobbers `text-gold` etc.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        { text: ['step-display', 'step-title', 'step-heading', 'step-label', 'step-meta', 'step-body', 'step-body-sm'] },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
