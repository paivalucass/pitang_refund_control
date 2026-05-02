import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { PrivateRoute } from '@/components/PrivateRoute'
import { PublicRoute } from '@/components/PublicRoute'
import { CategoriesPage } from '@/pages/CategoriesPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { EditReimbursementPage } from '@/pages/EditReimbursementPage'
import { LoginPage } from '@/pages/LoginPage'
import { NewReimbursementPage } from '@/pages/NewReimbursementPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ReimbursementDetailPage } from '@/pages/ReimbursementDetailPage'
import { UsersPage } from '@/pages/UsersPage'

function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route element={<PrivateRoute allowedRoles={['EMPLOYEE']} />}>
            <Route path="/reimbursements/new" element={<NewReimbursementPage />} />
            <Route path="/reimbursements/:id/edit" element={<EditReimbursementPage />} />
          </Route>
          <Route path="/reimbursements/:id" element={<ReimbursementDetailPage />} />
          <Route element={<PrivateRoute allowedRoles={['ADMIN']} />}>
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
