import { Minus, Plus } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { getInitials } from '@/lib/utils'
import { useEventDraftStore } from '@/store/eventDraftStore'
import type { Member } from '@/types'

interface Props {
  member: Member
}

export default function AttendeeRow({ member }: Props) {
  const { attendance, toggleAttendee, updateSongCount } = useEventDraftStore()
  const entry = attendance.find((a) => a.memberId === member.id)
  const isAttending = !!entry

  return (
    <div className="flex items-center gap-3 py-3 px-4 border-b border-border last:border-0">
      <div className="w-9 h-9 rounded-full bg-navy/10 flex items-center justify-center shrink-0">
        <span className="text-xs font-semibold text-navy">{getInitials(member.name)}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
        {isAttending && (
          <div className="flex items-center gap-2 mt-1.5">
            <button
              type="button"
              onClick={() => updateSongCount(member.id, (entry?.songCount ?? 1) - 1)}
              className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-navy hover:text-navy transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-5 text-center text-sm font-semibold text-navy">
              {entry?.songCount ?? 1}
            </span>
            <button
              type="button"
              onClick={() => updateSongCount(member.id, (entry?.songCount ?? 1) + 1)}
              className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-navy hover:text-navy transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
            <span className="text-xs text-muted-foreground">
              song{(entry?.songCount ?? 1) > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      <Switch
        checked={isAttending}
        onCheckedChange={() => toggleAttendee(member.id, member.name)}
      />
    </div>
  )
}
