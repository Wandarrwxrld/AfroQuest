import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin, loading, mfaSatisfied, mfaCheckLoading } = useAuth()
  if (loading || mfaCheckLoading) return null
  if (!isAdmin) return <Navigate to="/" replace />
  // Factor enrolled but this session hasn't completed the challenge yet -
  // this is the actual enforcement point, not just an optional setting.
  if (!mfaSatisfied) return <Navigate to="/mfa-challenge" replace />
  return <>{children}</>
}
