import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/utils/cn'
import Stamp from '@/components/ui/Stamp'
import { buttonClasses } from '@/components/ui/Button'

function describeError(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`.trim()
  }
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error) return error
  return 'An unexpected fault interrupted this request.'
}

interface ErrorCardProps {
  message: string
  compact?: boolean
  showReturn?: boolean
}

function ErrorCard({ message, compact = false, showReturn = true }: ErrorCardProps) {
  // The standalone route error page owns the document's h1; the nested (compact) card sits
  // inside a page that already has one.
  const Heading = compact ? 'h2' : 'h1'
  return (
    <div
      role="alert"
      className={cn(
        'texture-grain relative rounded-sm border border-blood-dark/60 bg-bureau-dark text-center text-off-white',
        compact ? 'p-5 max-w-md w-full' : 'p-6 sm:p-8 max-w-lg w-full',
      )}
    >
      {/* In flow (centred) on phones so it never overlaps the heading; pinned top-right from sm up. */}
      <Stamp
        tone="red"
        surface="dark"
        size="sm"
        rotate={-5}
        className="mb-4 sm:absolute sm:right-3 sm:top-3 sm:mb-0"
      >
        FILE ERROR
      </Stamp>
      <div className="flex items-center justify-center gap-2 text-blood-text">
        <AlertTriangle className="w-4 h-4" aria-hidden="true" />
        <span className="type-label text-blood-text">SYSTEM FAULT</span>
      </div>
      <Heading className={cn('mt-4 font-serif font-semibold text-gold', compact ? 'type-heading' : 'type-title')}>
        This file could not be retrieved
      </Heading>
      <p className="type-body-sm mt-3 break-words text-off-white/80">{message}</p>
      {showReturn && (
        <Link to="/" className={buttonClasses({ variant: 'secondary', className: 'mt-6' })}>
          Return to Bureau HQ
        </Link>
      )}
    </div>
  )
}

/** Root route errorElement. Renders standalone (replaces Layout). */
export default function RouteErrorBoundary() {
  const error = useRouteError()
  return (
    <main className="min-h-app bg-bureau-black flex items-center justify-center p-4">
      <ErrorCard message={describeError(error)} />
    </main>
  )
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/** Reusable boundary for wrapping isolated subtrees (e.g. the React Flow canvas). */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught an error', error, info.componentStack)
  }

  render(): ReactNode {
    const { error } = this.state
    if (error) {
      if (this.props.fallback !== undefined) return this.props.fallback
      return (
        <div className="flex items-center justify-center p-4">
          <ErrorCard message={describeError(error)} compact showReturn={false} />
        </div>
      )
    }
    return this.props.children
  }
}
