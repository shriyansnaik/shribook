import { useState } from 'react'
import { MoreHorizontal, Pencil, UserX, ShieldCheck, ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { deactivateMember, updateMember } from '@/services/member.service'
import { useToast } from '@/hooks/use-toast'
import { getInitials } from '@/lib/utils'
import type { Member } from '@/types'

interface Props {
  member: Member
  groupId: string
  onEdit: (member: Member) => void
}

export default function MemberRow({ member, groupId, onEdit }: Props) {
  const { toast } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [removing, setRemoving] = useState(false)

  const handleRemove = async () => {
    setRemoving(true)
    try {
      await deactivateMember(groupId, member.id)
      toast({ title: 'Member removed' })
    } catch {
      toast({ title: 'Error', description: 'Could not remove member.', variant: 'destructive' })
    } finally {
      setRemoving(false)
      setConfirmOpen(false)
    }
  }

  const toggleApprover = async () => {
    if (!member.isApprover && !member.email) {
      toast({ title: 'Add an email first', description: 'Approvers need an email to sign in.', variant: 'destructive' })
      return
    }
    try {
      await updateMember(groupId, member.id, { isApprover: !member.isApprover })
      toast({ title: member.isApprover ? 'Approver removed' : 'Marked as approver' })
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 py-3 px-4">
        <div className="w-9 h-9 rounded-full bg-navy/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-navy">{getInitials(member.name)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
            <Badge
              variant={member.role === 'founder' ? 'secondary' : 'outline'}
              className="text-[10px] shrink-0"
            >
              {member.role === 'founder' ? 'Founder' : 'Member'}
            </Badge>
            {member.isApprover && (
              <Badge variant="outline" className="text-[10px] shrink-0 gap-0.5 border-success/40 text-success">
                <ShieldCheck className="w-2.5 h-2.5" /> Approver
              </Badge>
            )}
          </div>
          {(member.phone || member.email) && (
            <p className="text-xs text-muted-foreground truncate">
              {member.phone ?? member.email}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(member)}>
              <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleApprover}>
              {member.isApprover
                ? <><ShieldOff className="w-3.5 h-3.5 mr-2" /> Remove approver</>
                : <><ShieldCheck className="w-3.5 h-3.5 mr-2" /> Make approver</>}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setConfirmOpen(true)}>
              <UserX className="w-3.5 h-3.5 mr-2" /> Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Remove Member"
        description={`Remove ${member.name} from this group? They won't appear in future events.`}
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={handleRemove}
        loading={removing}
      />
    </>
  )
}
