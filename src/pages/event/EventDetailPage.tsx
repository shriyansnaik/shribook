import { useParams, useNavigate } from 'react-router-dom'
import { Edit, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import PageHeader from '@/components/layout/PageHeader'
import EventStatusBadge from '@/components/events/EventStatusBadge'
import ConsolidationCard from '@/components/event-detail/ConsolidationCard'
import AttendanceTable from '@/components/event-detail/AttendanceTable'
import ExpenseTable from '@/components/event-detail/ExpenseTable'
import ApproversList from '@/components/event-detail/ApproversList'
import ActivityLogList from '@/components/event-detail/ActivityLogList'
import LockBanner from '@/components/event-detail/LockBanner'
import ApprovalRequestBanner from '@/components/event-edit/ApprovalRequestBanner'
import ExportMenu from '@/components/shared/ExportMenu'
import { useEvent } from '@/hooks/useEvent'
import { useApprovals } from '@/hooks/useApprovals'
import { useGroupStore } from '@/store/groupStore'
import { exportEventCSV, exportEventPDF } from '@/services/export.service'
import { ROUTES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

export default function EventDetailPage() {
  const { groupId, eventId } = useParams<{ groupId: string; eventId: string }>()
  const { userRole } = useGroupStore()
  const { event, attendance, expenses, loading } = useEvent(groupId, eventId)
  const { pending } = useApprovals(groupId, eventId)
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
              onExportCSV={() => exportEventCSV(event, attendance, expenses)}
              onExportPDF={() => exportEventPDF(event, attendance, expenses)}
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
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <EventStatusBadge status={event.status} />
          <span>{formatDate(event.date)}</span>
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{event.venue}</span>
        </div>

        {event.description && (
          <p className="text-sm text-muted-foreground">{event.description}</p>
        )}

        <LockBanner status={event.status} pendingCount={pending.length} />

        {isAdmin && pending.length > 0 && (
          <ApprovalRequestBanner groupId={groupId!} eventId={event.id} ratePerSong={event.ratePerSong} />
        )}

        <ConsolidationCard
          totalRevenue={event.totalRevenue}
          totalExpenses={event.totalExpenses}
          netAmount={event.netAmount}
        />

        <AttendanceTable attendance={attendance} />
        <ExpenseTable expenses={expenses} />
        <ApproversList event={event} groupId={groupId!} />
        <ActivityLogList groupId={groupId!} eventId={event.id} />
      </div>
    </div>
  )
}
