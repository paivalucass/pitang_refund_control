import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'

export function PublicRoute() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />
}
