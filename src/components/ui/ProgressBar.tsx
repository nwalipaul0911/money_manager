interface ProgressBarProps {
  value: number
  color?: 'needs' | 'wants' | 'wishlist' | 'income'
  size?: 'sm' | 'md'
}

const colors = {
  needs: 'bg-needs',
  wants: 'bg-wants',
  wishlist: 'bg-wishlist',
  income: 'bg-income',
}

export function ProgressBar({ value, color = 'income', size = 'md' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={`w-full bg-surface-overlay rounded-full overflow-hidden ${size === 'sm' ? 'h-1.5' : 'h-2.5'}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${colors[color]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
