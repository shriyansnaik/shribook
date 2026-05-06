import { useState } from 'react'
import { UserPlus, Users, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PageHeader from '@/components/layout/PageHeader'
import MemberRow from '@/components/members/MemberRow'
import MemberFormDialog from '@/components/members/MemberFormDialog'
import EmptyState from '@/components/shared/EmptyState'
import { useGroupStore } from '@/store/groupStore'
import type { Member } from '@/types'

export default function MembersPage() {
  const { activeGroup, members } = useGroupStore()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Member | undefined>()

  const filtered = members.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))

  const openEdit = (m: Member) => { setEditing(m); setDialogOpen(true) }
  const openAdd = () => { setEditing(undefined); setDialogOpen(true) }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title={`Members (${members.length})`}
        action={
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <UserPlus className="w-4 h-4" /> Add
          </Button>
        }
      />

      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search members…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {members.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6 text-muted-foreground" />}
          title="No members yet"
          description="Add members individually or paste a list of names."
          action={<Button size="sm" onClick={openAdd}>Add Members</Button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users className="w-6 h-6 text-muted-foreground" />} title="No results" />
      ) : (
        <div className="divide-y divide-border border-t border-b border-border mt-2">
          {filtered.map((m) => (
            <MemberRow key={m.id} member={m} groupId={activeGroup?.id ?? ''} onEdit={openEdit} />
          ))}
        </div>
      )}

      {activeGroup && (
        <MemberFormDialog
          open={dialogOpen}
          onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(undefined) }}
          groupId={activeGroup.id}
          editing={editing}
        />
      )}
    </div>
  )
}
