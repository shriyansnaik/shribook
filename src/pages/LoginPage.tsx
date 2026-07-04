import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/lib/constants'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import { FullLogo } from '@/components/shared/Logo'

export default function LoginPage() {
  const user = useAuthStore((s) => s.user)

  if (user) return <Navigate to={ROUTES.GROUPS} replace />

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <FullLogo className="h-16 w-auto mx-auto mb-5" />
          <p className="text-muted-foreground text-sm">
            Event finance tracking for singing groups
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
          <div className="brand-gradient rounded-xl px-4 py-3 mb-5 text-center">
            <p className="text-sm text-white/90">
              Sign in to manage your group events
            </p>
          </div>
          <GoogleSignInButton />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Admin access only &mdash; contact your group owner to join
        </p>
      </div>
    </div>
  )
}
