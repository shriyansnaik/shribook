import { useNavigate } from 'react-router-dom'
import { LogOut, ShieldCheck, Users, CalendarDays, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useGroups } from '@/hooks/useGroups'
import { signOut } from '@/services/auth.service'
import { ROUTES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { Group } from '@/types'

export default function SuperAdminPage() {
  const { groups, loading } = useGroups()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-gold" />
          <span className="font-semibold">Super Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.GROUPS)}>My Groups</Button>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-5">
          <h1 className="text-xl font-bold">All Groups</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? '…' : `${groups.length} group${groups.length !== 1 ? 's' : ''}`} · Read-only view
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => <SuperAdminGroupCard key={g.id} group={g} />)}
          </div>
        )}
      </main>
    </div>
  )
}

function SuperAdminGroupCard({ group }: { group: Group }) {
  const navigate = useNavigate()
  return (
    <Card
      className="cursor-pointer hover:shadow-card-hover transition-all"
      onClick={() => navigate(ROUTES.GROUP_DASHBOARD(group.id))}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{group.name}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {group.members.length} members
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> {group.admins.length} admin{group.admins.length > 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3 h-3" /> Created {group.createdAt ? formatDate(group.createdAt) : '—'}
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </CardContent>
    </Card>
  )
}
