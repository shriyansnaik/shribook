import { useState, useEffect } from 'react'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { Event } from '@/types'

export function useEvents(groupId: string | undefined) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!groupId) { setLoading(false); return }

    const q = query(
      collection(db, 'groups', groupId, 'events'),
      orderBy('date', 'desc')
    )

    const unsub = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Event)))
      setLoading(false)
    })

    return unsub
  }, [groupId])

  return { events, loading }
}
