import { useState } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ResponsiveDialog } from '@/components/shared/ResponsiveDialog'
import { addAttendee } from '@/services/event.service'
import { computeRowEarnings } from '@/lib/earnings'
import { useAuthStore } from '@/store/authStore'
import { useGroupStore } from '@/store/groupStore'
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
  currentAttendance: Attendance[]
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

export default function AddSingerDialog({ open, onOpenChange, groupId, eventId, ratePerSong, subsequentSongRate, guestFee, currentAttendance }: Props) {
  const user = useAuthStore((s) => s.user)
  const { members } = useGroupStore()
  const { toast } = useToast()
  const [memberId, setMemberId] = useState('')
  const [songCount, setSongCount] = useState(1)
  const [guestCount, setGuestCount] = useState(0)
  const [override, setOverride] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const attending = new Set(currentAttendance.filter(a => a.status === 'attending').map((a) => a.memberId))
  const available = members.filter((m) => !attending.has(m.id))
  const selected = members.find((m) => m.id === memberId)
  const isFounder = selected?.role === 'founder'

  const computed = selected
    ? computeRowEarnings({ isFounder, songCount, guestCount, ratePerSong, subsequentSongRate, guestFee })
    : 0

  const reset = () => { setMemberId(''); setSongCount(1); setGuestCount(0); setOverride(null) }

  const handleSubmit = async () => {
    if (!user || !selected) return
    setLoading(true)
    try {
      await addAttendee(
        groupId, eventId, { ratePerSong, subsequentSongRate, guestFee },
        { memberId, memberName: selected.name, isFounder, songCount, guestCount, earningsOverride: override },
        user.uid, user.displayName ?? 'Admin'
      )
      toast({ title: 'Singer added' })
      reset()
      onOpenChange(false)
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Add Singer">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Select Member</Label>
          <Select value={memberId} onValueChange={setMemberId}>
            <SelectTrigger><SelectValue placeholder="Choose a member…" /></SelectTrigger>
            <SelectContent>
              {available.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}{m.role === 'founder' ? ' · Founder' : ''}</SelectItem>
              ))}
              {available.length === 0 && (
                <SelectItem value="_none" disabled>All members are already attending</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label>Songs {isFounder && <Badge variant="secondary" className="text-[10px] ml-1">free</Badge>}</Label>
          <Stepper value={songCount} onDec={() => setSongCount(Math.max(0, songCount - 1))} onInc={() => setSongCount(songCount + 1)} />
        </div>

        <div className="flex items-center justify-between">
          <Label>Guests</Label>
          <Stepper value={guestCount} onDec={() => setGuestCount(Math.max(0, guestCount - 1))} onInc={() => setGuestCount(guestCount + 1)} />
        </div>

        {selected && (
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
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={!memberId || loading}>
            {loading ? 'Adding…' : 'Add Singer'}
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  )
}
