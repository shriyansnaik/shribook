import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <p className="text-6xl font-bold text-navy mb-4">404</p>
      <p className="text-muted-foreground mb-6">This page doesn't exist.</p>
      <Button onClick={() => navigate(ROUTES.GROUPS)}>Go to Groups</Button>
    </div>
  )
}
