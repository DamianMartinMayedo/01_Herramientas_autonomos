import { type ReactNode, type InputHTMLAttributes } from 'react'
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
      <label htmlFor={id} className="text-xs font-medium text-stone-600">
        {label}
      </label>
      <input
        id={id}
        className={cn(
          'rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900',
          'bg-white placeholder:text-stone-400',
          'focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600',
          'transition-colors duration-150',
          error && 'border-red-400 focus:ring-red-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error.message}</p>}
      {hint && !error && <p className="text-xs text-stone-400">{hint}</p>}
    </div>
  )
}

// Versión para textarea
interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: FieldError
}

export function TextAreaField({ label, error, className, ...props }: TextAreaFieldProps) {
  const id = props.id ?? props.name
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-stone-600">
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        className={cn(
          'rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900',
          'bg-white placeholder:text-stone-400 resize-none',
          'focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600',
          'transition-colors duration-150',
          error && 'border-red-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error.message}</p>}
    </div>
  )
}
