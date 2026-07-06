import type { ReactNode, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`bg-surface-raised border border-border rounded-2xl p-5 ${className}`} {...props}>
      {children}
    </div>
  )
}
