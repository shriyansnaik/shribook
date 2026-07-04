import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/store/authStore'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'
import type { Group } from '@/types'

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    const coll = collection(db, 'groups')

    // Super admin sees everything.
    if (user.email === SUPER_ADMIN_EMAIL) {
      return onSnapshot(query(coll, orderBy('createdAt', 'desc')), (snap) => {
        setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Group)))
        setLoading(false)
      })
    }

    // Regular users: groups where they're a member (by uid) OR where their email
    // is mirrored onto the group (invited members / approvers who sign in).
    // Track each source separately so one query's removal can't drop a group the
    // other query still matches.
    const fromUid = new Map<string, Group>()
    const fromEmail = new Map<string, Group>()
    const emit = () => {
      const merged = new Map<string, Group>()
      fromUid.forEach((g, id) => merged.set(id, g))
      fromEmail.forEach((g, id) => merged.set(id, g))
      setGroups([...merged.values()])
      setLoading(false)
    }

    const subscribe = (target: Map<string, Group>, field: 'members' | 'memberEmails', value: string) =>
      onSnapshot(query(coll, where(field, 'array-contains', value)), (snap) => {
        target.clear()
        snap.docs.forEach((d) => target.set(d.id, { id: d.id, ...d.data() } as Group))
        emit()
      })

    const unsubs: (() => void)[] = [subscribe(fromUid, 'members', user.uid)]
    if (user.email) unsubs.push(subscribe(fromEmail, 'memberEmails', user.email.toLowerCase()))

    return () => unsubs.forEach((u) => u())
  }, [user])

  return { groups, loading }
}
