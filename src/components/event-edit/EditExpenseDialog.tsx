import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResponsiveDialog } from '@/components/shared/ResponsiveDialog'
import { updateExpense } from '@/services/event.service'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import type { Expense } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  groupId: string
  eventId: string
  expense: Expense
}

export default function EditExpenseDialog({ open, onOpenChange, groupId, eventId, expense }: Props) {
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit } = useForm({
    defaultValues: { vendor: expense.vendor, amount: expense.amount },
  })

  const onSubmit = async (data: { vendor: string; amount: number }) => {
    if (!user) return
    setLoading(true)
    try {
      const payload = { vendor: data.vendor, amount: Number(data.amount) }
      await updateExpense(groupId, eventId, expense.id, payload, user.uid, user.displayName ?? 'Admin', expense.amount)
      toast({ title: 'Expense updated' })
      onOpenChange(false)
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Edit Expense">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Expense Name</Label>
          <Input {...register('vendor')} />
        </div>
        <div className="space-y-1.5">
          <Label>Amount (₹)</Label>
          <Input type="number" min={1} {...register('amount')} />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  )
}
