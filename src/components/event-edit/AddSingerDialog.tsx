import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ResponsiveDialog } from '@/components/shared/ResponsiveDialog'
import { addAttendee } from '@/services/event.service'
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
  ratePerSong: number
  currentAttendance: Attendance[]
}

export default function AddSingerDialog({ open, onOpenChange, groupId, eventId, eventStatus, ratePerSong, currentAttendance }: Props) {
  const user = useAuthStore((s) => s.user)
  const { members, activeGroup } = useGroupStore()
  const { toast } = useToast()
  const [memberId, setMemberId] = useState('')
  const [songCount, setSongCount] = useState(1)
  const [loading, setLoading] = useState(false)

  const attending = new Set(currentAttendance.filter(a => a.status === 'attending').map((a) => a.memberId))
  const available = members.filter((m) => !attending.has(m.id))
  const selected = members.find((m) => m.id === memberId)

  const isLocked = eventStatus === 'locked' || eventStatus === 'pending_approval'
  const adminCount = activeGroup?.admins.length ?? 1

  const handleSubmit = async () => {
    if (!user || !selected) return
    setLoading(true)
    try {
      if (isLocked) {
        await requestApproval(
          groupId, eventId, 'add_singer',
          `Add singer: ${selected.name} (${songCount} song${songCount > 1 ? 's' : ''})`,
          { memberId, memberName: selected.name, songCount },
          adminCount, user.uid, user.displayName ?? 'Admin'
        )
        toast({ title: 'Approval requested' })
      } else {
        await addAttendee(groupId, eventId, ratePerSong, { memberId, memberName: selected.name, songCount }, user.uid, user.displayName ?? 'Admin')
        toast({ title: 'Singer added' })
      }
      setMemberId('')
      setSongCount(1)
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
      title="Add Singer"
      description={isLocked ? 'This event is locked. The addition will require admin approval.' : undefined}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Select Member</Label>
          <Select value={memberId} onValueChange={setMemberId}>
            <SelectTrigger><SelectValue placeholder="Choose a member…" /></SelectTrigger>
            <SelectContent>
              {available.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
              {available.length === 0 && (
                <SelectItem value="_none" disabled>All members are already attending</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Number of Songs</Label>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSongCount(Math.max(1, songCount - 1))}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:border-navy transition-colors">
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-semibold text-lg">{songCount}</span>
            <button type="button" onClick={() => setSongCount(songCount + 1)}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:border-navy transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={!memberId || loading}>
            {loading ? 'Adding…' : isLocked ? 'Request Approval' : 'Add Singer'}
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  )
}
