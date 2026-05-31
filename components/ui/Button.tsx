import { type ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
  size?: 'sm' | 'md'
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        'inline-flex items-center justify-center rounded-xl font-semibold transition-colors disabled:opacity-60',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-3 text-base',
        variant === 'primary' && 'bg-sky-400 text-slate-900 hover:bg-sky-300 active:bg-sky-500',
        variant === 'ghost' && 'bg-slate-800 text-slate-300 hover:bg-slate-700 active:bg-slate-600',
        className
      )}
    >
      {children}
    </button>
  )
}
