import { useState } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { getInitials, cn } from '@/lib/utils'
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

// Inline editable earnings. Shows the auto-calculated amount until an admin types
// a custom figure, at which point it becomes a manual override (gold-tinted, with
// a reset control to snap back to auto).
function AmountBox({
  computed, override, onSet,
}: { computed: number; override: number | null; onSet: (v: number | null) => void }) {
  const overridden = override != null
  const shown = overridden ? override! : computed
  // Local buffer lets the field be cleared/typed freely while focused.
  const [buf, setBuf] = useState<string | null>(null)
  const value = buf ?? String(shown)

  return (
    <div className="flex items-center gap-1">
      <div className={cn(
        'flex items-center h-8 rounded-md border pl-2 pr-1.5 transition-colors focus-within:ring-1 focus-within:ring-navy/40',
        overridden ? 'border-gold/60 bg-gold/5' : 'border-transparent hover:border-border',
      )}>
        <span className="text-xs text-muted-foreground mr-0.5">₹</span>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          aria-label="Amount"
          className={cn(
            'w-16 bg-transparent text-right text-sm font-semibold tabular-nums outline-none',
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
            overridden ? 'text-gold' : 'text-success',
          )}
          value={value}
          onFocus={(e) => { setBuf(String(shown)); e.currentTarget.select() }}
          onChange={(e) => {
            const v = e.target.value
            setBuf(v)
            if (v !== '' && !Number.isNaN(Number(v))) onSet(Math.max(0, Number(v)))
          }}
          onBlur={() => {
            // Emptying the field means "go back to auto".
            if (buf === '') onSet(null)
            setBuf(null)
          }}
        />
      </div>
      {overridden && (
        <button
          type="button"
          onClick={() => onSet(null)}
          title="Reset to auto"
          className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-navy hover:bg-muted transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

export default function AttendeeRow({ member }: Props) {
  const { attendance, step1, toggleAttendee, updateSongCount, updateGuestCount, setEarningsOverride } = useEventDraftStore()
  const entry = attendance.find((a) => a.memberId === member.id)
  const isAttending = !!entry
  const isFounder = member.role === 'founder'

  const computed = entry
    ? computeRowEarnings({
        isFounder,
        songCount: entry.songCount,
        guestCount: entry.guestCount,
        ratePerSong: step1?.ratePerSong ?? 0,
        subsequentSongRate: step1?.subsequentSongRate,
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
          <AmountBox
            computed={computed}
            override={entry!.earningsOverride ?? null}
            onSet={(v) => setEarningsOverride(member.id, v)}
          />
        )}
      </div>
    </div>
  )
}
