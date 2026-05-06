import { useNavigate } from 'react-router-dom'
import { MapPin, Users, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import EventStatusBadge from './EventStatusBadge'
import CurrencyDisplay from '@/components/shared/CurrencyDisplay'
import { ROUTES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { Event } from '@/types'

interface Props {
  event: Event
  groupId: string
}

export default function EventCard({ event, groupId }: Props) {
  const navigate = useNavigate()

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99]"
      onClick={() => navigate(ROUTES.EVENT_DETAIL(groupId, event.id))}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{event.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(event.date)}</p>
          </div>
          <EventStatusBadge status={event.status} />
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {event.venue}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> {event.attendingCount} singers
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-xs">
            <span className="text-muted-foreground">
              In: <span className="font-medium text-success">{formatCurrency(event.totalRevenue)}</span>
            </span>
            <span className="text-muted-foreground">
              Out: <span className="font-medium text-danger">{formatCurrency(event.totalExpenses)}</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Net:</span>
            <CurrencyDisplay amount={event.netAmount} showSign size="sm" />
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}
