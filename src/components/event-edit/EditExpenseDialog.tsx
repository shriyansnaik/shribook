import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ResponsiveDialog } from '@/components/shared/ResponsiveDialog'
import { updateExpense } from '@/services/event.service'
import { requestApproval } from '@/services/approval.service'
import { useAuthStore } from '@/store/authStore'
import { useGroupStore } from '@/store/groupStore'
import { useToast } from '@/hooks/use-toast'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import type { Expense, EventStatus } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  groupId: string
  eventId: string
  eventStatus: EventStatus
  expense: Expense
}

export default function EditExpenseDialog({ open, onOpenChange, groupId, eventId, eventStatus, expense }: Props) {
  const user = useAuthStore((s) => s.user)
  const { activeGroup } = useGroupStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState<string>(expense.category)

  const { register, handleSubmit } = useForm({
    defaultValues: { vendor: expense.vendor, amount: expense.amount, notes: expense.notes ?? '' },
  })

  const isLocked = eventStatus === 'locked' || eventStatus === 'pending_approval'
  const adminCount = activeGroup?.admins.length ?? 1

  const onSubmit = async (data: { vendor: string; amount: number; notes: string }) => {
    if (!user) return
    setLoading(true)
    try {
      const payload = { vendor: data.vendor, amount: Number(data.amount), notes: data.notes || null }
      if (isLocked) {
        await requestApproval(
          groupId, eventId, 'edit_expense',
          `Edit expense: ${data.vendor}`,
          { expenseId: expense.id, ...payload },
          adminCount, user.uid, user.displayName ?? 'Admin'
        )
        toast({ title: 'Approval requested' })
      } else {
        await updateExpense(groupId, eventId, expense.id, payload, user.uid, user.displayName ?? 'Admin')
        toast({ title: 'Expense updated' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Edit Expense"
      description={isLocked ? 'This event is locked. Changes require admin approval.' : undefined}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Vendor</Label>
          <Input {...register('vendor')} />
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Amount (₹)</Label>
          <Input type="number" min={1} {...register('amount')} />
        </div>
        <div className="space-y-1.5">
          <Label>Notes (optional)</Label>
          <Input {...register('notes')} />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Saving…' : isLocked ? 'Request Approval' : 'Save'}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  )
}
