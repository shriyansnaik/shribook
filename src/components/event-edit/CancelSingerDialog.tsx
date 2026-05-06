import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ResponsiveDialog } from '@/components/shared/ResponsiveDialog'
import { cancelAttendance } from '@/services/event.service'
import { requestApproval } from '@/services/approval.service'
import { useAuthStore } from '@/store/authStore'
import { useGroupStore } from '@/store/groupStore'
import { useToast } from '@/hooks/use-toast'
import type { Attendance, EventStatus } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  groupId: string
  eventId: string
  eventStatus: EventStatus
  attendance: Attendance
}

export default function CancelSingerDialog({ open, onOpenChange, groupId, eventId, eventStatus, attendance }: Props) {
  const user = useAuthStore((s) => s.user)
  const { activeGroup } = useGroupStore()
  const { toast } = useToast()
  const [refund, setRefund] = useState(false)
  const [loading, setLoading] = useState(false)

  const isLocked = eventStatus === 'locked' || eventStatus === 'pending_approval'
  const adminCount = activeGroup?.admins.length ?? 1

  const handleSubmit = async () => {
    if (!user) return
    setLoading(true)
    try {
      if (isLocked) {
        await requestApproval(
          groupId, eventId, 'cancel_singer',
          `Cancel singer: ${attendance.memberName} (${refund ? 'with refund' : 'no refund'})`,
          { attendanceId: attendance.id, refundIssued: refund },
          adminCount, user.uid, user.displayName ?? 'Admin'
        )
        toast({ title: 'Approval requested', description: 'Awaiting admin approval.' })
      } else {
        await cancelAttendance(groupId, eventId, attendance.id, refund, user.uid, user.displayName ?? 'Admin')
        toast({ title: 'Singer cancelled' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Cancel ${attendance.memberName}`}
      description={isLocked ? 'This event is locked. The cancellation will require admin approval.' : undefined}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <Label className="text-sm font-medium">Issue Refund</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mark if the singer will receive their payment back
            </p>
          </div>
          <Switch checked={refund} onCheckedChange={setRefund} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" className="flex-1" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processing…' : isLocked ? 'Request Approval' : 'Confirm Cancel'}
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  )
}
