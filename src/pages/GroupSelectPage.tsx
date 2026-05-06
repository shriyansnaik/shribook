import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, LogOut, ShieldCheck, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import GroupCard from '@/components/group/GroupCard'
import CreateGroupDialog from '@/components/group/CreateGroupDialog'
import EmptyState from '@/components/shared/EmptyState'
import { useGroups } from '@/hooks/useGroups'
import { useAuthStore } from '@/store/authStore'
import { signOut } from '@/services/auth.service'
import { ROUTES, SUPER_ADMIN_EMAIL } from '@/lib/constants'

export default function GroupSelectPage() {
  const user = useAuthStore((s) => s.user)
  const { groups, loading } = useGroups()
  const [createOpen, setCreateOpen] = useState(false)
  const navigate = useNavigate()
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
            <Music className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-foreground">Shribook</span>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-gold" onClick={() => navigate(ROUTES.SUPER_ADMIN)}>
              <ShieldCheck className="w-4 h-4" /> Super Admin
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-foreground">Your Groups</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {user?.displayName ?? user?.email}
            </p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> New Group
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={<Music className="w-7 h-7 text-muted-foreground" />}
            title="No groups yet"
            description="Create your first group to start tracking events."
            action={<Button onClick={() => setCreateOpen(true)}>Create Group</Button>}
          />
        ) : (
          <div className="space-y-3">
            {groups.map((g) => <GroupCard key={g.id} group={g} />)}
          </div>
        )}
      </main>

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
