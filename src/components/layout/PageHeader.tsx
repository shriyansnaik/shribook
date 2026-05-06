import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  backTo?: string
  action?: React.ReactNode
  className?: string
}

export default function PageHeader({ title, backTo, action, className }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className={cn('flex items-center gap-3 px-4 py-3 border-b border-border bg-card', className)}>
      {backTo && (
        <Button variant="ghost" size="icon" onClick={() => navigate(backTo)} className="-ml-1">
          <ChevronLeft className="w-5 h-5" />
        </Button>
      )}
      <h1 className="font-semibold text-foreground flex-1 truncate">{title}</h1>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
