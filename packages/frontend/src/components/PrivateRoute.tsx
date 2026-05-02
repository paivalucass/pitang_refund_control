import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/types'

export function PrivateRoute({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Acesso negado</h1>
          <p className="mt-2 text-slate-500">Seu perfil não tem permissão para acessar esta página.</p>
        </div>
      </div>
    )
  }

  return <Outlet />
}
