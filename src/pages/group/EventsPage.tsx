import { useNavigate } from 'react-router-dom'
import { Plus, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import EventCard from '@/components/events/EventCard'
import EmptyState from '@/components/shared/EmptyState'
import PageHeader from '@/components/layout/PageHeader'
import { useGroupStore } from '@/store/groupStore'
import { useEvents } from '@/hooks/useEvents'
import { ROUTES } from '@/lib/constants'

export default function EventsPage() {
  const { activeGroup } = useGroupStore()
  const { events, loading } = useEvents(activeGroup?.id)
  const navigate = useNavigate()

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Events"
        action={
          <Button size="sm" className="gap-1.5" onClick={() => navigate(ROUTES.EVENT_CREATE(activeGroup?.id ?? ''))}>
            <Plus className="w-4 h-4" /> New Event
          </Button>
        }
      />
      <div className="p-4 space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : events.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="w-6 h-6 text-muted-foreground" />}
            title="No events yet"
            action={<Button size="sm" onClick={() => navigate(ROUTES.EVENT_CREATE(activeGroup?.id ?? ''))}>Create Event</Button>}
          />
        ) : (
          events.map((e) => <EventCard key={e.id} event={e} groupId={activeGroup?.id ?? ''} />)
        )}
      </div>
    </div>
  )
}
