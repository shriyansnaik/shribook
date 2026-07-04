import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ResponsiveDialog } from '@/components/shared/ResponsiveDialog'
import { addMember, updateMember } from '@/services/member.service'
import { memberSchema, type MemberFormValues } from '@/lib/validators'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import type { Member, MemberRole } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  groupId: string
  editing?: Member
}

export default function MemberFormDialog({ open, onOpenChange, groupId, editing }: Props) {
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<MemberRole>(editing?.role ?? 'member')
  const [isApprover, setIsApprover] = useState<boolean>(editing?.isApprover ?? false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    values: editing ? { name: editing.name, phone: editing.phone ?? '', email: editing.email ?? '' } : undefined,
  })

  // Keep role/approver in sync when the dialog is reused for a different member
  useEffect(() => {
    setRole(editing?.role ?? 'member')
    setIsApprover(editing?.isApprover ?? false)
  }, [editing, open])

  const onSubmit = async (data: MemberFormValues) => {
    if (!user) return
    setLoading(true)
    try {
      if (editing) {
        await updateMember(groupId, editing.id, {
          name: data.name, phone: data.phone || null, email: data.email || null, role, isApprover,
        })
        toast({ title: 'Member updated' })
      } else {
        await addMember(groupId, { ...data, role, isApprover }, user.uid)
        toast({ title: 'Member added' })
      }
      reset()
      setRole('member')
      setIsApprover(false)
      onOpenChange(false)
    } catch {
      toast({ title: 'Error', description: 'Could not save member.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit Member' : 'Add Member'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="mname">Name *</Label>
          <Input id="mname" placeholder="Full name" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as MemberRole)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="founder">Founder</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Founders don't pay for their own songs (₹0), but their guests are still charged.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mphone">Phone (optional)</Label>
          <Input id="mphone" type="tel" placeholder="+91 98765 43210" {...register('phone')} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="memail">Email (optional)</Label>
          <Input id="memail" type="email" placeholder="name@example.com" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          <p className="text-xs text-muted-foreground">
            Needed if this member should sign in to view or approve events.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <Label className="text-sm font-medium">Approver</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Can review and approve events (requires an email).
            </p>
          </div>
          <Switch checked={isApprover} onCheckedChange={setIsApprover} />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Saving…' : editing ? 'Save Changes' : 'Add Member'}
        </Button>
      </form>
    </ResponsiveDialog>
  )
}
