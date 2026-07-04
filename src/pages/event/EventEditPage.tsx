import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { UserX, UserPlus, Edit, Trash2, Settings2, Gift, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import PageHeader from '@/components/layout/PageHeader'
import LockBanner from '@/components/event-detail/LockBanner'
import CancelSingerDialog from '@/components/event-edit/CancelSingerDialog'
import AddSingerDialog from '@/components/event-edit/AddSingerDialog'
import EditAttendeeDialog from '@/components/event-edit/EditAttendeeDialog'
import EditExpenseDialog from '@/components/event-edit/EditExpenseDialog'
import AddExpenseDialog from '@/components/event-edit/AddExpenseDialog'
import EditEventDetailsDialog from '@/components/event-edit/EditEventDetailsDialog'
import AddSponsorDialog from '@/components/event-edit/AddSponsorDialog'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { useEvent } from '@/hooks/useEvent'
import { useAuthStore } from '@/store/authStore'
import { deleteExpense, deleteSponsor, deleteEvent } from '@/services/event.service'
import { useToast } from '@/hooks/use-toast'
import { ROUTES } from '@/lib/constants'
import { formatCurrency, getInitials } from '@/lib/utils'
import type { Attendance, Expense, Sponsor } from '@/types'

export default function EventEditPage() {
  const { groupId, eventId } = useParams<{ groupId: string; eventId: string }>()
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()
  const navigate = useNavigate()
  const { event, attendance, expenses, sponsors, loading } = useEvent(groupId, eventId)

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<Attendance | null>(null)
  const [editAttendee, setEditAttendee] = useState<Attendance | null>(null)
  const [addSingerOpen, setAddSingerOpen] = useState(false)
  const [addExpenseOpen, setAddExpenseOpen] = useState(false)
  const [addSponsorOpen, setAddSponsorOpen] = useState(false)
  const [editExpenseTarget, setEditExpenseTarget] = useState<Expense | null>(null)
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState<Expense | null>(null)
  const [deleteSponsorTarget, setDeleteSponsorTarget] = useState<Sponsor | null>(null)
  const [deleteEventOpen, setDeleteEventOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  if (loading || !event) return <div className="p-4"><Skeleton className="h-40 w-full rounded-xl" /></div>

  const attending = attendance.filter((a) => a.status === 'attending')

  const handleDeleteExpense = async () => {
    if (!user || !deleteExpenseTarget) return
    setBusy(true)
    try {
      await deleteExpense(groupId!, eventId!, deleteExpenseTarget.id, user.uid, user.displayName ?? 'Admin', { vendor: deleteExpenseTarget.vendor, amount: deleteExpenseTarget.amount })
      toast({ title: 'Expense deleted' })
      setDeleteExpenseTarget(null)
    } catch { toast({ title: 'Error', variant: 'destructive' }) } finally { setBusy(false) }
  }

  const handleDeleteSponsor = async () => {
    if (!user || !deleteSponsorTarget) return
    setBusy(true)
    try {
      await deleteSponsor(groupId!, eventId!, deleteSponsorTarget.id, user.uid, user.displayName ?? 'Admin', { name: deleteSponsorTarget.name, amount: deleteSponsorTarget.amount })
      toast({ title: 'Sponsor removed' })
      setDeleteSponsorTarget(null)
    } catch { toast({ title: 'Error', variant: 'destructive' }) } finally { setBusy(false) }
  }

  const handleDeleteEvent = async () => {
    if (!groupId || !eventId) return
    setBusy(true)
    try {
      await deleteEvent(groupId, eventId)
      toast({ title: 'Event deleted' })
      navigate(ROUTES.GROUP_EVENTS(groupId))
    } catch {
      toast({ title: 'Error deleting event', variant: 'destructive' })
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Edit Event" backTo={ROUTES.EVENT_DETAIL(groupId ?? '', eventId ?? '')} />
      <div className="p-4 space-y-4">
        <LockBanner status={event.status} />

        {/* Details */}
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm">Details</CardTitle>
            <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => setDetailsOpen(true)}>
              <Settings2 className="w-3.5 h-3.5" /> Edit
            </Button>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-0.5">
            <p><span className="text-foreground font-medium">{event.title}</span> · {event.eventType === 'special' ? 'Special' : 'Regular'}</p>
            <p>{event.subsequentSongRate != null && event.subsequentSongRate !== event.ratePerSong
              ? `₹${event.ratePerSong} first · ₹${event.subsequentSongRate}/extra song`
              : `₹${event.ratePerSong}/song`} · ₹{event.guestFee ?? 0}/guest</p>
          </CardContent>
        </Card>

        {/* Singers */}
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm">Singers ({attending.length})</CardTitle>
            <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => setAddSingerOpen(true)}>
              <UserPlus className="w-3.5 h-3.5" /> Add Singer
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {attending.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">No active singers.</p>
            ) : (
              <div className="divide-y divide-border">
                {attending.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-navy">{getInitials(a.memberName)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.memberName}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.songCount} song{a.songCount === 1 ? '' : 's'}{(a.guestCount ?? 0) > 0 ? ` · ${a.guestCount} guest${a.guestCount === 1 ? '' : 's'}` : ''} · {formatCurrency(a.earnings)}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditAttendee(a)}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setCancelTarget(a)}>
                      <UserX className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm">Expenses ({expenses.length})</CardTitle>
            <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => setAddExpenseOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {expenses.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">No expenses added.</p>
            ) : (
              <div className="divide-y divide-border">
                {expenses.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.vendor}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(e.amount)}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditExpenseTarget(e)}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteExpenseTarget(e)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sponsors */}
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-1.5"><Gift className="w-4 h-4 text-gold" /> Sponsors ({sponsors.length})</CardTitle>
            <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => setAddSponsorOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {sponsors.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">No sponsors added.</p>
            ) : (
              <div className="divide-y divide-border">
                {sponsors.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <p className="text-xs text-success">{formatCurrency(s.amount)}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteSponsorTarget(s)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card className="border-destructive/40">
          <CardHeader className="pb-3"><CardTitle className="text-sm text-destructive">Danger Zone</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Delete this event</p>
                <p className="text-xs text-muted-foreground mt-0.5">Permanently removes the event and all its data.</p>
              </div>
              <Button variant="destructive" size="sm" className="shrink-0" onClick={() => setDeleteEventOpen(true)}>
                <Trash2 className="w-4 h-4 mr-1.5" /> Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <EditEventDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} groupId={groupId!} event={event} />
      <AddSingerDialog open={addSingerOpen} onOpenChange={setAddSingerOpen}
        groupId={groupId!} eventId={eventId!} ratePerSong={event.ratePerSong} subsequentSongRate={event.subsequentSongRate} guestFee={event.guestFee ?? 0} currentAttendance={attendance} />
      <AddExpenseDialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen} groupId={groupId!} eventId={eventId!} />
      <AddSponsorDialog open={addSponsorOpen} onOpenChange={setAddSponsorOpen} groupId={groupId!} eventId={eventId!} />
      {editAttendee && (
        <EditAttendeeDialog open={!!editAttendee} onOpenChange={(v) => !v && setEditAttendee(null)}
          groupId={groupId!} eventId={eventId!} ratePerSong={event.ratePerSong} subsequentSongRate={event.subsequentSongRate} guestFee={event.guestFee ?? 0} attendance={editAttendee} />
      )}
      {cancelTarget && (
        <CancelSingerDialog open={!!cancelTarget} onOpenChange={(v) => !v && setCancelTarget(null)}
          groupId={groupId!} eventId={eventId!} attendance={cancelTarget} />
      )}
      {editExpenseTarget && (
        <EditExpenseDialog open={!!editExpenseTarget} onOpenChange={(v) => !v && setEditExpenseTarget(null)}
          groupId={groupId!} eventId={eventId!} expense={editExpenseTarget} />
      )}
      <ConfirmDialog
        open={!!deleteExpenseTarget} onOpenChange={(v) => !v && setDeleteExpenseTarget(null)}
        title="Delete Expense" description={`Delete "${deleteExpenseTarget?.vendor}"?`}
        confirmLabel="Delete" variant="destructive" onConfirm={handleDeleteExpense} loading={busy}
      />
      <ConfirmDialog
        open={!!deleteSponsorTarget} onOpenChange={(v) => !v && setDeleteSponsorTarget(null)}
        title="Remove Sponsor" description={`Remove "${deleteSponsorTarget?.name}"?`}
        confirmLabel="Remove" variant="destructive" onConfirm={handleDeleteSponsor} loading={busy}
      />
      <ConfirmDialog
        open={deleteEventOpen} onOpenChange={setDeleteEventOpen}
        title={`Delete "${event.title}"?`}
        description="This permanently deletes the event and all its singers, expenses, sponsors, and logs. This cannot be undone."
        confirmLabel="Delete Event" variant="destructive" onConfirm={handleDeleteEvent} loading={busy}
      />
    </div>
  )
}
