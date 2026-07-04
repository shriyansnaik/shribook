import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ResponsiveDialog } from '@/components/shared/ResponsiveDialog'
import { updateAttendee } from '@/services/event.service'
import { computeRowEarnings } from '@/lib/earnings'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import type { Attendance } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  groupId: string
  eventId: string
  ratePerSong: number
  guestFee: number
  attendance: Attendance
}

function Stepper({ value, onDec, onInc }: { value: number; onDec: () => void; onInc: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={onDec}
        className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:border-navy transition-colors">
        <Minus className="w-4 h-4" />
      </button>
      <span className="w-8 text-center font-semibold text-lg tabular-nums">{value}</span>
      <button type="button" onClick={onInc}
        className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:border-navy transition-colors">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function EditAttendeeDialog({ open, onOpenChange, groupId, eventId, ratePerSong, guestFee, attendance }: Props) {
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()
  const [songCount, setSongCount] = useState(attendance.songCount)
  const [guestCount, setGuestCount] = useState(attendance.guestCount ?? 0)
  const [loading, setLoading] = useState(false)

  const amount = computeRowEarnings({ isFounder: attendance.isFounder, songCount, guestCount, ratePerSong, guestFee })

  const handleSubmit = async () => {
    if (!user) return
    setLoading(true)
    try {
      await updateAttendee(
        groupId, eventId, attendance.id, { ratePerSong, guestFee },
        { memberName: attendance.memberName, isFounder: attendance.isFounder, songCount: attendance.songCount, guestCount: attendance.guestCount ?? 0 },
        { songCount, guestCount },
        user.uid, user.displayName ?? 'Admin'
      )
      toast({ title: 'Singer updated' })
      onOpenChange(false)
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={`Edit ${attendance.memberName}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Songs {attendance.isFounder && <Badge variant="secondary" className="text-[10px] ml-1">free</Badge>}</Label>
          <Stepper value={songCount} onDec={() => setSongCount(Math.max(0, songCount - 1))} onInc={() => setSongCount(songCount + 1)} />
        </div>
        <div className="flex items-center justify-between">
          <Label>Guests</Label>
          <Stepper value={guestCount} onDec={() => setGuestCount(Math.max(0, guestCount - 1))} onInc={() => setGuestCount(guestCount + 1)} />
        </div>
        <div className="flex justify-between items-center rounded-lg bg-muted/60 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-semibold text-success">{formatCurrency(amount)}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={loading}>{loading ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>
    </ResponsiveDialog>
  )
}
