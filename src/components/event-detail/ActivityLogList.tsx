import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { getInitials } from '@/lib/utils'
import { useActivityLog } from '@/hooks/useActivityLog'

interface Props {
  groupId: string
  eventId: string
}

export default function ActivityLogList({ groupId, eventId }: Props) {
  const log = useActivityLog(groupId, eventId)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Activity Log</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {log.length === 0 ? (
          <p className="px-4 py-4 text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {log.map((entry) => (
              <div key={entry.id} className="flex gap-3 px-4 py-3">
                <div className="w-7 h-7 rounded-full bg-navy/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-semibold text-navy">{getInitials(entry.actorName)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{entry.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {entry.actorName} · {entry.timestamp ? formatDate(entry.timestamp) : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
