import { Lock, Unlock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EventStatus } from '@/types'

interface Props {
  status: EventStatus
  pendingCount?: number
}

export default function LockBanner({ status, pendingCount = 0 }: Props) {
  if (status === 'active') return null

  const isPendingApproval = status === 'pending_approval'
  const isLocked = status === 'locked'

  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm',
        isPendingApproval && 'bg-orange-50 text-orange-800 border border-orange-200',
        isLocked && 'bg-amber-50 text-amber-800 border border-amber-200'
      )}
    >
      {isLocked ? <Lock className="w-4 h-4 shrink-0 mt-0.5" /> : <Unlock className="w-4 h-4 shrink-0 mt-0.5" />}
      <div>
        {isPendingApproval ? (
          <>
            <p className="font-medium">Approval Pending</p>
            <p className="text-xs mt-0.5">
              {pendingCount} edit request{pendingCount > 1 ? 's' : ''} awaiting admin approval.
            </p>
          </>
        ) : (
          <>
            <p className="font-medium">Event Locked</p>
            <p className="text-xs mt-0.5">
              Any edits require approval from at least 2 admins.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
