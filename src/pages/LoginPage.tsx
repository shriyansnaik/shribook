import { Navigate } from 'react-router-dom'
import { Music } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/lib/constants'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

export default function LoginPage() {
  const user = useAuthStore((s) => s.user)

  if (user) return <Navigate to={ROUTES.GROUPS} replace />

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-navy rounded-2xl mb-5 shadow-card">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Shribook</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Singing group event finance tracker
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-card">
          <p className="text-sm text-center text-muted-foreground mb-5">
            Sign in to manage your group events
          </p>
          <GoogleSignInButton />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Admin access only &mdash; contact your group owner to join
        </p>
      </div>
    </div>
  )
}
