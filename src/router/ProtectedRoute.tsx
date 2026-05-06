import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/lib/constants'

export default function ProtectedRoute() {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />
  return <Outlet />
}
