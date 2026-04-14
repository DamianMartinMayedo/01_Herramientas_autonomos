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
    <div className="input-group">
      <label htmlFor={id} className="input-label">
        {label}
      </label>
      <input
        id={id}
        className={cn(
          'input-v3',
          error && 'is-error',
          className
        )}
        {...props}
      />
      {error && <p className="input-error-msg">{error.message}</p>}
      {hint && !error && <p className="input-hint">{hint}</p>}
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
    <div className="input-group">
      <label htmlFor={id} className="input-label">
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        className={cn(
          'textarea-v3',
          error && 'is-error',
          className
        )}
        {...props}
      />
      {error && <p className="input-error-msg">{error.message}</p>}
    </div>
  )
}
