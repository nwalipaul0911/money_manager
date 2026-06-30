import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-surface-raised border border-border rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  )
}
