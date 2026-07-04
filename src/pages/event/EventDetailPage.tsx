import { useParams, useNavigate } from 'react-router-dom'
import { Edit, MapPin, Music, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import PageHeader from '@/components/layout/PageHeader'
import EventStatusBadge from '@/components/events/EventStatusBadge'
import ConsolidationCard from '@/components/event-detail/ConsolidationCard'
import AttendanceTable from '@/components/event-detail/AttendanceTable'
import ExpenseTable from '@/components/event-detail/ExpenseTable'
import ApproversList from '@/components/event-detail/ApproversList'
import ActivityLogList from '@/components/event-detail/ActivityLogList'
import LockBanner from '@/components/event-detail/LockBanner'
import ExportMenu from '@/components/shared/ExportMenu'
import { useEvent } from '@/hooks/useEvent'
import { useGroupStore } from '@/store/groupStore'
import { exportEventCSV, exportEventPDF } from '@/services/export.service'
import { ROUTES } from '@/lib/constants'
import { formatDate, formatCurrency } from '@/lib/utils'

export default function EventDetailPage() {
  const { groupId, eventId } = useParams<{ groupId: string; eventId: string }>()
  const { userRole } = useGroupStore()
  const { event, attendance, expenses, sponsors, loading } = useEvent(groupId, eventId)
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  if (!event) return null

  const isAdmin = userRole === 'admin'

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title={event.title}
        backTo={ROUTES.GROUP_EVENTS(groupId ?? '')}
        action={
          <div className="flex items-center gap-2">
            <ExportMenu
              onExportCSV={() => exportEventCSV(event, attendance, expenses, sponsors)}
              onExportPDF={() => exportEventPDF(event, attendance, expenses, sponsors)}
            />
            {isAdmin && (
              <Button size="sm" variant="outline" className="gap-1.5"
                onClick={() => navigate(ROUTES.EVENT_EDIT(groupId ?? '', event.id))}>
                <Edit className="w-4 h-4" /> Edit
              </Button>
            )}
          </div>
        }
      />

      <div className="p-4 space-y-4">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
          <EventStatusBadge status={event.status} />
          {event.eventType === 'special' && (
            <Badge className="bg-gold/15 text-gold border-gold/30">Special Event</Badge>
          )}
          <span>{formatDate(event.date)}</span>
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{event.venue}</span>
          <span className="flex items-center gap-1"><Music className="w-3.5 h-3.5" />
            {event.subsequentSongRate != null && event.subsequentSongRate !== event.ratePerSong
              ? `₹${event.ratePerSong} first · ₹${event.subsequentSongRate}/extra song`
              : `₹${event.ratePerSong}/song`} · ₹{event.guestFee ?? 0}/guest</span>
        </div>

        {event.description && (
          <p className="text-sm text-muted-foreground">{event.description}</p>
        )}

        <LockBanner status={event.status} />

        <ConsolidationCard
          totalRevenue={event.totalRevenue}
          totalSponsors={event.totalSponsors ?? 0}
          totalExpenses={event.totalExpenses}
          netAmount={event.netAmount}
        />

        <AttendanceTable attendance={attendance} />
        <ExpenseTable expenses={expenses} />

        {sponsors.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5"><Gift className="w-4 h-4 text-gold" /> Sponsors ({sponsors.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {sponsors.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="truncate">{s.name}</span>
                    <span className="font-medium text-success tabular-nums">{formatCurrency(s.amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <ApproversList event={event} groupId={groupId!} />
        <ActivityLogList groupId={groupId!} eventId={event.id} />
      </div>
    </div>
  )
}
