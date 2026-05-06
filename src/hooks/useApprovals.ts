import { useState, useEffect } from 'react'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { Approval } from '@/types'

export function useApprovals(groupId: string | undefined, eventId: string | undefined) {
  const [approvals, setApprovals] = useState<Approval[]>([])

  useEffect(() => {
    if (!groupId || !eventId) return

    const q = query(
      collection(db, 'groups', groupId, 'events', eventId, 'approvals'),
      orderBy('requestedAt', 'desc')
    )

    return onSnapshot(q, (snap) => {
      setApprovals(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Approval)))
    })
  }, [groupId, eventId])

  const pending = approvals.filter((a) => a.status === 'pending')
  return { approvals, pending }
}
