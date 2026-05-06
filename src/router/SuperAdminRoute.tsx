import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { SUPER_ADMIN_EMAIL, ROUTES } from '@/lib/constants'

interface Props {
  children: React.ReactNode
}

export default function SuperAdminRoute({ children }: Props) {
  const user = useAuthStore((s) => s.user)
  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    return <Navigate to={ROUTES.GROUPS} replace />
  }
  return <>{children}</>
}
