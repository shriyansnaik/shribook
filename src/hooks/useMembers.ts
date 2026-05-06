import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { Member } from '@/types'

export function useMembers(groupId: string | undefined) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!groupId) { setLoading(false); return }

    const q = query(
      collection(db, 'groups', groupId, 'members'),
      where('isActive', '==', true),
      orderBy('name')
    )

    const unsub = onSnapshot(q, (snap) => {
      setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Member)))
      setLoading(false)
    })

    return unsub
  }, [groupId])

  return { members, loading }
}
