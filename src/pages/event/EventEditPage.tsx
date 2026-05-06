import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { UserX, UserPlus, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import PageHeader from '@/components/layout/PageHeader'
import LockBanner from '@/components/event-detail/LockBanner'
import CancelSingerDialog from '@/components/event-edit/CancelSingerDialog'
import AddSingerDialog from '@/components/event-edit/AddSingerDialog'
import EditExpenseDialog from '@/components/event-edit/EditExpenseDialog'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { useEvent } from '@/hooks/useEvent'
import { useGroupStore } from '@/store/groupStore'
import { useAuthStore } from '@/store/authStore'
import { deleteExpense } from '@/services/event.service'
import { requestApproval } from '@/services/approval.service'
import { useToast } from '@/hooks/use-toast'
import { ROUTES } from '@/lib/constants'
import { formatCurrency, getInitials } from '@/lib/utils'
import type { Attendance, Expense } from '@/types'

export default function EventEditPage() {
  const { groupId, eventId } = useParams<{ groupId: string; eventId: string }>()
  const { activeGroup } = useGroupStore()
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()
  const { event, attendance, expenses, loading } = useEvent(groupId, eventId)

  const [cancelTarget, setCancelTarget] = useState<Attendance | null>(null)
  const [addSingerOpen, setAddSingerOpen] = useState(false)
  const [editExpenseTarget, setEditExpenseTarget] = useState<Expense | null>(null)
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState(false)

  if (loading || !event) return <div className="p-4"><Skeleton className="h-40 w-full rounded-xl" /></div>

  const isLocked = event.status === 'locked' || event.status === 'pending_approval'
  const adminCount = activeGroup?.admins.length ?? 1
  const attending = attendance.filter((a) => a.status === 'attending')

  const handleDeleteExpense = async () => {
    if (!user || !deleteExpenseTarget) return
    setDeleting(true)
    try {
      if (isLocked) {
        await requestApproval(groupId!, eventId!, 'delete_expense',
          `Delete expense: ${deleteExpenseTarget.vendor}`,
          { expenseId: deleteExpenseTarget.id },
          adminCount, user.uid, user.displayName ?? 'Admin')
        toast({ title: 'Approval requested' })
      } else {
        await deleteExpense(groupId!, eventId!, deleteExpenseTarget.id, user.uid, user.displayName ?? 'Admin')
        toast({ title: 'Expense deleted' })
      }
      setDeleteExpenseTarget(null)
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Edit Event"
        backTo={ROUTES.EVENT_DETAIL(groupId ?? '', eventId ?? '')}
      />
      <div className="p-4 space-y-4">
        <LockBanner status={event.status} />

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
                      <p className="text-xs text-muted-foreground">{a.songCount} song{a.songCount > 1 ? 's' : ''} · {formatCurrency(a.earnings)}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive h-8"
                      onClick={() => setCancelTarget(a)}>
                      <UserX className="w-3.5 h-3.5" /> Cancel
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Expenses ({expenses.length})</CardTitle>
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
                      <p className="text-xs text-muted-foreground">{e.category} · {formatCurrency(e.amount)}</p>
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
      </div>

      {cancelTarget && (
        <CancelSingerDialog open={!!cancelTarget} onOpenChange={(v) => !v && setCancelTarget(null)}
          groupId={groupId!} eventId={eventId!} eventStatus={event.status} attendance={cancelTarget} />
      )}
      <AddSingerDialog open={addSingerOpen} onOpenChange={setAddSingerOpen}
        groupId={groupId!} eventId={eventId!} eventStatus={event.status} ratePerSong={event.ratePerSong} currentAttendance={attendance} />
      {editExpenseTarget && (
        <EditExpenseDialog open={!!editExpenseTarget} onOpenChange={(v) => !v && setEditExpenseTarget(null)}
          groupId={groupId!} eventId={eventId!} eventStatus={event.status} expense={editExpenseTarget} />
      )}
      <ConfirmDialog
        open={!!deleteExpenseTarget}
        onOpenChange={(v) => !v && setDeleteExpenseTarget(null)}
        title="Delete Expense"
        description={`Delete "${deleteExpenseTarget?.vendor}"? ${isLocked ? 'This requires admin approval.' : ''}`}
        confirmLabel={isLocked ? 'Request Approval' : 'Delete'}
        variant="destructive"
        onConfirm={handleDeleteExpense}
        loading={deleting}
      />
    </div>
  )
}
