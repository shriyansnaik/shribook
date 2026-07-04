import { Badge } from '@/components/ui/badge'
import type { EventStatus } from '@/types'

const config: Record<EventStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  active: { label: 'Active', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  locked: { label: 'Locked', className: 'bg-amber-50 text-amber-700 border-amber-200' },
}

export default function EventStatusBadge({ status }: { status: EventStatus }) {
  const { label, className } = config[status]
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}
