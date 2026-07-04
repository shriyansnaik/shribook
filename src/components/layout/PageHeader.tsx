import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  backTo?: string
  onBack?: () => void
  action?: React.ReactNode
  className?: string
}

export default function PageHeader({ title, backTo, onBack, action, className }: PageHeaderProps) {
  const navigate = useNavigate()
  const showBack = onBack || backTo

  return (
    <div className={cn('flex items-center gap-3 px-4 py-3 border-b border-border bg-card', className)}>
      {showBack && (
        <Button variant="ghost" size="icon" onClick={() => (onBack ? onBack() : navigate(backTo!))} className="-ml-1">
          <ChevronLeft className="w-5 h-5" />
        </Button>
      )}
      <h1 className="font-semibold text-foreground flex-1 truncate">{title}</h1>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
