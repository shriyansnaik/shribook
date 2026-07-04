import { Minus, Plus } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { getInitials, formatCurrency } from '@/lib/utils'
import { computeRowEarnings } from '@/lib/earnings'
import { useEventDraftStore } from '@/store/eventDraftStore'
import type { Member } from '@/types'

interface Props {
  member: Member
}

function Stepper({ value, onDec, onInc, label }: { value: number; onDec: () => void; onInc: () => void; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={onDec}
        className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-navy hover:text-navy transition-colors">
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-5 text-center text-sm font-semibold text-navy tabular-nums">{value}</span>
      <button type="button" onClick={onInc}
        className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-navy hover:text-navy transition-colors">
        <Plus className="w-3 h-3" />
      </button>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

export default function AttendeeRow({ member }: Props) {
  const { attendance, step1, toggleAttendee, updateSongCount, updateGuestCount } = useEventDraftStore()
  const entry = attendance.find((a) => a.memberId === member.id)
  const isAttending = !!entry
  const isFounder = member.role === 'founder'

  const rowAmount = entry
    ? computeRowEarnings({
        isFounder,
        songCount: entry.songCount,
        guestCount: entry.guestCount,
        ratePerSong: step1?.ratePerSong ?? 0,
        guestFee: step1?.guestFee ?? 0,
      })
    : 0

  return (
    <div className="flex items-start gap-3 py-3 px-4 border-b border-border last:border-0">
      <div className="w-9 h-9 rounded-full bg-navy/10 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-xs font-semibold text-navy">{getInitials(member.name)}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
          {isFounder && <Badge variant="secondary" className="text-[10px] shrink-0">Founder</Badge>}
        </div>
        {isAttending && (
          <div className="mt-2 space-y-2">
            <Stepper
              value={entry!.songCount}
              onDec={() => updateSongCount(member.id, entry!.songCount - 1)}
              onInc={() => updateSongCount(member.id, entry!.songCount + 1)}
              label={`song${entry!.songCount === 1 ? '' : 's'}${isFounder ? ' (free)' : ''}`}
            />
            <Stepper
              value={entry!.guestCount}
              onDec={() => updateGuestCount(member.id, entry!.guestCount - 1)}
              onInc={() => updateGuestCount(member.id, entry!.guestCount + 1)}
              label={`guest${entry!.guestCount === 1 ? '' : 's'}`}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <Switch
          checked={isAttending}
          onCheckedChange={() => toggleAttendee(member.id, member.name, isFounder)}
        />
        {isAttending && (
          <span className="text-sm font-semibold text-success tabular-nums">{formatCurrency(rowAmount)}</span>
        )}
      </div>
    </div>
  )
}
