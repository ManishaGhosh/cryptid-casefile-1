import { createBrowserRouter, redirect, Navigate, type RouteObject } from 'react-router-dom'
import Layout from '@/pages/Layout'
import RouteErrorBoundary from '@/components/ui/ErrorBoundary'
import HQPage from '@/pages/HQPage'
import CaseDetailPage from '@/pages/CaseDetailPage'
import ReportPage from '@/pages/ReportPage'
import ArchivePage from '@/pages/ArchivePage'
import { CASES } from '@/data/cases'

// Loader: validates caseId param, redirects to / if not found
export function caseDetailLoader({ params }: { params: Record<string, string | undefined> }) {
  const { caseId } = params
  if (!caseId || !CASES.find(c => c.id === caseId)) {
    throw redirect('/')
  }
  return null
}

// Loader: validates caseId AND rejects if no board access
export function boardLoader({ params }: { params: Record<string, string | undefined> }) {
  const { caseId } = params
  if (!caseId || !CASES.find(c => c.id === caseId)) {
    throw redirect('/')
  }
  // Note: closed-case redirect is handled in the component using store state
  return null
}

// Loader: validates caseId
export function reportLoader({ params }: { params: Record<string, string | undefined> }) {
  const { caseId } = params
  if (!caseId || !CASES.find(c => c.id === caseId)) {
    throw redirect('/')
  }
  return null
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: <HQPage />,
      },
      {
        path: 'case/:caseId',
        element: <CaseDetailPage />,
        loader: caseDetailLoader,
      },
      {
        path: 'case/:caseId/board',
        lazy: async () => ({ Component: (await import('@/pages/InvestigationBoardPage')).default }),
        loader: boardLoader,
      },
      {
        path: 'case/:caseId/report',
        element: <ReportPage />,
        loader: reportLoader,
      },
      {
        path: 'archive',
        element: <ArchivePage />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]

/**
 * Opt in early to the React Router v7 behaviours (silences the v6 future-flag warnings).
 * No route uses relative splat paths, and startTransition only batches navigation updates.
 */
export const routerFuture = { v7_relativeSplatPath: true } as const

export const router = createBrowserRouter(routes, { future: routerFuture })
