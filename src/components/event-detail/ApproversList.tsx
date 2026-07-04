import { useState } from 'react'
import { CheckCircle2, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { approveEvent } from '@/services/event.service'
import { useAuthStore } from '@/store/authStore'
import { useGroupStore } from '@/store/groupStore'
import { useToast } from '@/hooks/use-toast'
import type { Event } from '@/types'

interface Props {
  event: Event
  groupId: string
}

export default function ApproversList({ event, groupId }: Props) {
  const user = useAuthStore((s) => s.user)
  const { userRole, activeGroup } = useGroupStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const hasApproved = user ? event.approvers.includes(user.uid) : false
  const email = user?.email?.toLowerCase()
  const isApprover = !!email && (activeGroup?.approverEmails ?? []).includes(email)
  const canApprove = userRole === 'admin' || isApprover

  const handleApprove = async () => {
    if (!user) return
    setLoading(true)
    try {
      await approveEvent(groupId, event.id, user.uid, user.displayName ?? 'Admin')
      toast({ title: 'Event approved', description: 'Your approval has been recorded.' })
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gold" />
          Reviewed By
          {event.approvers.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-[10px]">
              {event.approvers.length} approval{event.approvers.length > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {event.approverNames.length === 0 ? (
          <p className="text-sm text-muted-foreground">No approvals yet.</p>
        ) : (
          event.approverNames.map((name, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              <span className="font-medium">{name}</span>
              <span className="text-xs text-muted-foreground ml-auto">approved</span>
            </div>
          ))
        )}

        {canApprove && !hasApproved && (
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-2 border-success text-success hover:bg-success/10"
            onClick={handleApprove}
            disabled={loading}
          >
            {loading ? 'Approving…' : 'Approve This Event'}
          </Button>
        )}

        {hasApproved && (
          <p className="text-xs text-success flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> You have approved this event
          </p>
        )}
      </CardContent>
    </Card>
  )
}
