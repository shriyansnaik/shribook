import { useState } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ResponsiveDialog } from '@/components/shared/ResponsiveDialog'
import { updateAttendee } from '@/services/event.service'
import { computeRowEarnings } from '@/lib/earnings'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { Attendance } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  groupId: string
  eventId: string
  ratePerSong: number
  subsequentSongRate?: number
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

export default function EditAttendeeDialog({ open, onOpenChange, groupId, eventId, ratePerSong, subsequentSongRate, guestFee, attendance }: Props) {
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()
  const [songCount, setSongCount] = useState(attendance.songCount)
  const [guestCount, setGuestCount] = useState(attendance.guestCount ?? 0)
  const [override, setOverride] = useState<number | null>(attendance.earningsOverride ?? null)
  const [loading, setLoading] = useState(false)

  const computed = computeRowEarnings({ isFounder: attendance.isFounder, songCount, guestCount, ratePerSong, subsequentSongRate, guestFee })

  const handleSubmit = async () => {
    if (!user) return
    setLoading(true)
    try {
      await updateAttendee(
        groupId, eventId, attendance.id, { ratePerSong, subsequentSongRate, guestFee },
        { memberName: attendance.memberName, isFounder: attendance.isFounder, songCount: attendance.songCount, guestCount: attendance.guestCount ?? 0 },
        { songCount, guestCount, earningsOverride: override },
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
          <span className="text-muted-foreground">Amount {override != null && <span className="text-gold">· custom</span>}</span>
          <div className="flex items-center gap-1.5">
            <div className={cn('flex items-center h-8 rounded-md border pl-2 pr-1.5 bg-background focus-within:ring-1 focus-within:ring-navy/40',
              override != null ? 'border-gold/60' : 'border-border')}>
              <span className="text-xs text-muted-foreground mr-0.5">₹</span>
              <input
                type="number" min={0} inputMode="numeric" aria-label="Amount"
                className={cn('w-20 bg-transparent text-right font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                  override != null ? 'text-gold' : 'text-success')}
                value={override != null ? String(override) : String(computed)}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '') setOverride(null)
                  else if (!Number.isNaN(Number(v))) setOverride(Math.max(0, Number(v)))
                }}
              />
            </div>
            {override != null && (
              <button type="button" onClick={() => setOverride(null)} title="Reset to auto"
                className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-navy hover:bg-muted transition-colors">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={loading}>{loading ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>
    </ResponsiveDialog>
  )
}
