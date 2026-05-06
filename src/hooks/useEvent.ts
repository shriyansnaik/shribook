import { useState, useEffect } from 'react'
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { checkAndLockIfNeeded } from '@/services/event.service'
import type { Event, Attendance, Expense } from '@/types'

export function useEvent(groupId: string | undefined, eventId: string | undefined) {
  const [event, setEvent] = useState<Event | null>(null)
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!groupId || !eventId) { setLoading(false); return }

    const unsubs: (() => void)[] = []

    unsubs.push(
      onSnapshot(doc(db, 'groups', groupId, 'events', eventId), (snap) => {
        if (!snap.exists()) { setEvent(null); setLoading(false); return }
        const ev = { id: snap.id, ...snap.data() } as Event
        setEvent(ev)
        setLoading(false)
        checkAndLockIfNeeded(groupId, eventId, ev.lockedAt, ev.status)
      })
    )

    unsubs.push(
      onSnapshot(
        query(collection(db, 'groups', groupId, 'events', eventId, 'attendance'), orderBy('memberName')),
        (snap) => setAttendance(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Attendance)))
      )
    )

    unsubs.push(
      onSnapshot(
        collection(db, 'groups', groupId, 'events', eventId, 'expenses'),
        (snap) => setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense)))
      )
    )

    return () => unsubs.forEach((u) => u())
  }, [groupId, eventId])

  return { event, attendance, expenses, loading }
}
