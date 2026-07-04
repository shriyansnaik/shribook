import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResponsiveDialog } from '@/components/shared/ResponsiveDialog'
import { addExpense } from '@/services/event.service'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  groupId: string
  eventId: string
}

export default function AddExpenseDialog({ open, onOpenChange, groupId, eventId }: Props) {
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!user || !name.trim() || amount <= 0) return
    setLoading(true)
    try {
      await addExpense(groupId, eventId, { vendor: name.trim(), amount }, user.uid, user.displayName ?? 'Admin')
      toast({ title: 'Expense added' })
      setName(''); setAmount(0)
      onOpenChange(false)
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Add Expense">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Expense Name</Label>
          <Input placeholder="e.g. Hall rent, Sound system" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Amount (₹)</Label>
          <Input type="number" min={1} value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={loading || !name.trim() || amount <= 0}>
            {loading ? 'Adding…' : 'Add Expense'}
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  )
}
