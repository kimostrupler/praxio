import Link from 'next/link'
import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: { label: string; href: string }
  /** Renders without the card wrapper — use inside existing containers */
  inline?: boolean
}

export default function EmptyState({ icon, title, description, action, inline }: EmptyStateProps) {
  const content = (
    <div className="text-center space-y-2.5 py-6">
      {icon && (
        <div className="flex justify-center text-muted">
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-muted">{title}</p>
        {description && (
          <p className="text-xs text-muted mt-1 opacity-70">{description}</p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-mid hover:text-content transition-colors"
        >
          {action.label} →
        </Link>
      )}
    </div>
  )

  if (inline) return content

  return (
    <div className="bg-card border border-line rounded-xl">
      {content}
    </div>
  )
}
