import { useNavigate } from 'react-router-dom'
import { Plus, CalendarDays, Users, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import EventCard from '@/components/events/EventCard'
import EmptyState from '@/components/shared/EmptyState'
import { useGroupStore } from '@/store/groupStore'
import { useEvents } from '@/hooks/useEvents'
import { ROUTES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'

export default function DashboardPage() {
  const { activeGroup, members } = useGroupStore()
  const { events, loading } = useEvents(activeGroup?.id)
  const navigate = useNavigate()

  const recent = events.slice(0, 3)
  const eventsNet = events.reduce((s, e) => s + e.netAmount, 0)
  const totalNet = (activeGroup?.openingBalance ?? 0) + eventsNet

  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-4 pt-5 pb-3 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{activeGroup?.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Dashboard</p>
        </div>
        <Button size="sm" className="gap-1.5 shrink-0" onClick={() => navigate(ROUTES.EVENT_CREATE(activeGroup?.id ?? ''))}>
          <Plus className="w-4 h-4" /> New Event
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-4 mb-5">
        <Card>
          <CardContent className="p-3 text-center">
            <Users className="w-4 h-4 text-navy mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{members.length}</p>
            <p className="text-[10px] text-muted-foreground">Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CalendarDays className="w-4 h-4 text-navy mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{events.length}</p>
            <p className="text-[10px] text-muted-foreground">Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-4 h-4 text-success mx-auto mb-1" />
            <p className="text-sm font-bold text-success">{formatCurrency(totalNet)}</p>
            <p className="text-[10px] text-muted-foreground">Net (All)</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent events */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground">Recent Events</p>
          {events.length > 3 && (
            <Button variant="ghost" size="sm" className="text-navy text-xs" onClick={() => navigate(ROUTES.GROUP_EVENTS(activeGroup?.id ?? ''))}>
              View all
            </Button>
          )}
        </div>
        {loading ? (
          <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="w-6 h-6 text-muted-foreground" />}
            title="No events yet"
            description="Create your first event to start tracking finances."
            action={<Button size="sm" onClick={() => navigate(ROUTES.EVENT_CREATE(activeGroup?.id ?? ''))}>Create Event</Button>}
          />
        ) : (
          <div className="space-y-3">
            {recent.map((e) => <EventCard key={e.id} event={e} groupId={activeGroup?.id ?? ''} />)}
          </div>
        )}
      </div>
    </div>
  )
}
