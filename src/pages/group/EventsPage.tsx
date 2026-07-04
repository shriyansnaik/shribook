import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import EventCard from '@/components/events/EventCard'
import EmptyState from '@/components/shared/EmptyState'
import PageHeader from '@/components/layout/PageHeader'
import { useGroupStore } from '@/store/groupStore'
import { useEvents } from '@/hooks/useEvents'
import { ROUTES } from '@/lib/constants'

type Filter = 'all' | 'regular' | 'special'

export default function EventsPage() {
  const { activeGroup } = useGroupStore()
  const { events, loading } = useEvents(activeGroup?.id)
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = filter === 'all' ? events : events.filter((e) => e.eventType === filter)

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
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            <TabsTrigger value="regular" className="flex-1">Regular</TabsTrigger>
            <TabsTrigger value="special" className="flex-1">Special</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="w-6 h-6 text-muted-foreground" />}
            title={filter === 'all' ? 'No events yet' : `No ${filter} events`}
            action={filter === 'all'
              ? <Button size="sm" onClick={() => navigate(ROUTES.EVENT_CREATE(activeGroup?.id ?? ''))}>Create Event</Button>
              : undefined}
          />
        ) : (
          filtered.map((e) => <EventCard key={e.id} event={e} groupId={activeGroup?.id ?? ''} />)
        )}
      </div>
    </div>
  )
}
