import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { ActivityLogEntry } from '@/types'

export function useActivityLog(groupId: string | undefined, eventId: string | undefined) {
  const [log, setLog] = useState<ActivityLogEntry[]>([])

  useEffect(() => {
    if (!groupId || !eventId) return

    const q = query(
      collection(db, 'groups', groupId, 'events', eventId, 'activityLog'),
      orderBy('timestamp', 'desc'),
      limit(50)
    )

    return onSnapshot(q, (snap) => {
      setLog(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityLogEntry))
      )
    })
  }, [groupId, eventId])

  return log
}
