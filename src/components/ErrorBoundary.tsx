'use client'
import React from 'react'

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) return this.props.fallback ?? (
      <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-6 text-center">
        <p className="text-sm text-[#666666]">Dieser Bereich konnte nicht geladen werden.</p>
        <button onClick={() => this.setState({ hasError: false })} className="mt-3 text-xs text-[#444444] hover:text-[#efefef] transition-colors">
          Erneut versuchen
        </button>
      </div>
    )
    return this.props.children
  }
}
