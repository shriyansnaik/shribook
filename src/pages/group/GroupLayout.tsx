import { useEffect, useState } from 'react'
import { useParams, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore'
import { ChevronLeft } from 'lucide-react'
import { db } from '@/config/firebase'
import { BrandMark } from '@/components/shared/Logo'
import { useAuthStore } from '@/store/authStore'
import { useGroupStore } from '@/store/groupStore'
import { ROUTES } from '@/lib/constants'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
import LoadingScreen from '@/components/layout/LoadingScreen'
import type { Group, Member } from '@/types'

export default function GroupLayout() {
  const { groupId } = useParams<{ groupId: string }>()
  const user = useAuthStore((s) => s.user)
  const { setGroup, setUserRole, setMembers, clearGroup, activeGroup } = useGroupStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!groupId || !user) return

    const unsubs: (() => void)[] = []

    unsubs.push(
      onSnapshot(doc(db, 'groups', groupId), (snap) => {
        if (!snap.exists()) { setNotFound(true); setLoading(false); return }
        const group = { id: snap.id, ...snap.data() } as Group
        setGroup(group)
        setUserRole(group.admins.includes(user.uid) ? 'admin' : 'member')
        setLoading(false)
      })
    )

    unsubs.push(
      onSnapshot(
        query(collection(db, 'groups', groupId, 'members'), where('isActive', '==', true)),
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Member))
          list.sort((a, b) => a.name.localeCompare(b.name))
          setMembers(list)
        }
      )
    )

    return () => {
      unsubs.forEach((u) => u())
      clearGroup()
    }
  }, [groupId, user, setGroup, setUserRole, setMembers, clearGroup])

  if (loading) return <LoadingScreen />
  if (notFound) return <Navigate to={ROUTES.GROUPS} replace />

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 min-w-0 pb-16 md:pb-0">
        <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-card md:hidden">
          <button
            onClick={() => navigate(ROUTES.GROUPS)}
            className="flex items-center gap-0.5 text-sm text-muted-foreground active:opacity-60"
          >
            <ChevronLeft className="w-4 h-4" />
            All Groups
          </button>
          <span className="mx-2 text-border">·</span>
          <span className="text-sm font-medium text-foreground truncate flex-1">{activeGroup?.name}</span>
          <BrandMark className="h-6 w-6 shrink-0 ml-2" />
        </div>
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
