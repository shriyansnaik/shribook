import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { castVote } from '@/services/approval.service'
import { useAuthStore } from '@/store/authStore'
import { useGroupStore } from '@/store/groupStore'
import { useApprovals } from '@/hooks/useApprovals'
import { useToast } from '@/hooks/use-toast'

interface Props {
  groupId: string
  eventId: string
  ratePerSong: number
}

export default function ApprovalRequestBanner({ groupId, eventId, ratePerSong }: Props) {
  const user = useAuthStore((s) => s.user)
  const { userRole } = useGroupStore()
  const { toast } = useToast()
  const { pending } = useApprovals(groupId, eventId)
  const [voting, setVoting] = useState<string | null>(null)

  if (pending.length === 0 || userRole !== 'admin') return null

  const handleVote = async (approvalId: string, vote: 'approve' | 'reject') => {
    if (!user) return
    setVoting(approvalId + vote)
    try {
      await castVote(groupId, eventId, approvalId, vote, user.uid, user.displayName ?? 'Admin', ratePerSong)
      toast({ title: vote === 'approve' ? 'Approved' : 'Rejected' })
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setVoting(null)
    }
  }

  return (
    <Card className="border-orange-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          Pending Approvals
          <Badge className="bg-orange-100 text-orange-800 border-orange-200 ml-auto">{pending.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending.map((approval) => {
          const approveVotes = Object.values(approval.votes).filter((v) => v.vote === 'approve').length
          const hasVoted = user ? user.uid in approval.votes : false
          return (
            <div key={approval.id} className="rounded-lg border border-border p-3 space-y-2">
              <p className="text-sm font-medium">{approval.changeDescription}</p>
              <p className="text-xs text-muted-foreground">
                {approveVotes}/{approval.requiredApprovals} approvals received
              </p>
              {!hasVoted && (
                <div className="flex gap-2">
                  <Button
                    size="sm" variant="outline"
                    className="flex-1 border-success text-success hover:bg-success/10 gap-1"
                    onClick={() => handleVote(approval.id, 'approve')}
                    disabled={!!voting}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {voting === approval.id + 'approve' ? '…' : 'Approve'}
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    className="flex-1 border-destructive text-destructive hover:bg-destructive/10 gap-1"
                    onClick={() => handleVote(approval.id, 'reject')}
                    disabled={!!voting}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    {voting === approval.id + 'reject' ? '…' : 'Reject'}
                  </Button>
                </div>
              )}
              {hasVoted && (
                <p className="text-xs text-muted-foreground">You have already voted on this request.</p>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
