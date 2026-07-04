import { Lock } from 'lucide-react'
import type { EventStatus } from '@/types'

interface Props {
  status: EventStatus
}

export default function LockBanner({ status }: Props) {
  if (status !== 'locked') return null

  return (
    <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm bg-amber-50 text-amber-800 border border-amber-200">
      <Lock className="w-4 h-4 shrink-0 mt-0.5" />
      <div>
        <p className="font-medium">Event Locked</p>
        <p className="text-xs mt-0.5">
          This event is past its date and has been locked. You can still edit it if needed.
        </p>
      </div>
    </div>
  )
}
