import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Button } from './Button.vue'

export const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[0.3rem] text-sm font-bold transition-[color,background-color,transform] duration-150 outline-none focus-visible:ring-3 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-px',
  {
    variants: {
      variant: {
        default: 'bg-[var(--ink)] text-[color:var(--paper-light)] hover:bg-[var(--accent-dark)]',
        accent: 'bg-[var(--accent)] text-[color:var(--paper-light)] hover:bg-[var(--accent-dark)]',
        outline: 'border border-[var(--ink)] bg-[var(--paper-light)] text-[color:var(--ink)] hover:bg-[var(--paper-deep)]',
        ghost: 'bg-transparent text-[color:var(--ink)] hover:bg-[var(--paper-deep)]',
        destructive: 'bg-[oklch(0.52_0.19_25)] text-[color:var(--paper-light)] hover:bg-[oklch(0.43_0.17_25)]',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6',
        icon: 'size-10 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
