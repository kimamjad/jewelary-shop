import { type ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import type { UserRole } from "@/types"

interface ProtectedRouteProps {
  children: ReactNode
  requireRoles?: UserRole[]
}

export function ProtectedRoute({ children, requireRoles }: ProtectedRouteProps) {
  const { user, profile, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="animate-pulse text-muted-foreground">در حال بارگذاری...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireRoles && profile && !requireRoles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
