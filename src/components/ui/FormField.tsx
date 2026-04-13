import { type InputHTMLAttributes } from 'react'
import { type FieldError } from 'react-hook-form'
import { cn } from '../../utils/cn'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: FieldError
  hint?: string
}

export function FormField({ label, error, hint, className, ...props }: FormFieldProps) {
  const id = props.id ?? props.name
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </label>
      <input
        id={id}
        className={cn(
          'rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm',
          'text-zinc-900 dark:text-zinc-100',
          'bg-white dark:bg-zinc-800',
          'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
          'focus:outline-none focus:ring-2 focus:ring-[var(--tool-mid,#3b82f6)] focus:border-[var(--tool-mid,#3b82f6)]',
          'transition-colors duration-150',
          error && 'border-red-400 focus:ring-red-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error.message}</p>}
      {hint && !error && <p className="text-xs text-zinc-400 dark:text-zinc-500">{hint}</p>}
    </div>
  )
}

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: FieldError
}

export function TextAreaField({ label, error, className, ...props }: TextAreaFieldProps) {
  const id = props.id ?? props.name
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        className={cn(
          'rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm',
          'text-zinc-900 dark:text-zinc-100',
          'bg-white dark:bg-zinc-800',
          'placeholder:text-zinc-400 dark:placeholder:text-zinc-500 resize-none',
          'focus:outline-none focus:ring-2 focus:ring-[var(--tool-mid,#3b82f6)] focus:border-[var(--tool-mid,#3b82f6)]',
          'transition-colors duration-150',
          error && 'border-red-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error.message}</p>}
    </div>
  )
}
