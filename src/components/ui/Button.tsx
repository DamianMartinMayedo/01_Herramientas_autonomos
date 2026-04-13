import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

const variantBase = {
  primary:   'text-white',
  secondary: 'bg-white border border-zinc-300 text-zinc-800 hover:bg-zinc-50',
  ghost:     'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
  danger:    'text-red-600 hover:bg-red-50 border border-red-200',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const primaryStyle =
    variant === 'primary'
      ? { backgroundColor: 'var(--tool-dark, #18181b)', ...style }
      : style

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantBase[variant],
        sizes[size],
        className
      )}
      style={primaryStyle}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  )
}
