import type { InputHTMLAttributes } from 'react'

interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  value: string
  onChange: (value: string) => void
  hint?: string
}

export function MoneyInput({ label, value, onChange, hint, className = '', ...props }: MoneyInputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-text-muted">{label}</label>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full pl-7 ${className}`}
          {...props}
        />
      </div>
      {hint && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  )
}
