'use client'
import { useFormStatus } from 'react-dom'

export default function SubmitButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={`disabled:opacity-50 disabled:cursor-not-allowed transition-opacity focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-card focus-visible:outline-none rounded-lg ${className ?? ''}`}
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin shrink-0"
            width="13" height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" opacity="0.3"/>
            <path d="M12 2v4"/>
          </svg>
          {children}
        </span>
      ) : children}
    </button>
  )
}
