import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-95',
  {
    variants: {
      variant: {
        default: 'bg-casino-gold text-casino-dark hover:bg-yellow-400 focus-visible:ring-yellow-400',
        declare: 'bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-500',
        accept: 'bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-500',
        fold: 'bg-red-700 text-white hover:bg-red-600 focus-visible:ring-red-600',
        exchange: 'bg-amber-700 text-white hover:bg-amber-600 focus-visible:ring-amber-600',
        ghost: 'text-white hover:bg-white/10',
        outline: 'border border-white/30 text-white hover:bg-white/10',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-11 px-5 text-base',
        lg: 'h-14 px-8 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => {
  return <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
})
Button.displayName = 'Button'
