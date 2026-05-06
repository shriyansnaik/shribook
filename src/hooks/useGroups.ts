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
    const q = user.email === SUPER_ADMIN_EMAIL
      ? query(coll, orderBy('createdAt', 'desc'))
      : query(coll, where('members', 'array-contains', user.uid))

    const unsub = onSnapshot(q, (snap) => {
      setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Group)))
      setLoading(false)
    })

    return unsub
  }, [user])

  return { groups, loading }
}
