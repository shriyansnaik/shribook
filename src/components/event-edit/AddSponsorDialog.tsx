import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResponsiveDialog } from '@/components/shared/ResponsiveDialog'
import { addSponsor } from '@/services/event.service'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  groupId: string
  eventId: string
}

export default function AddSponsorDialog({ open, onOpenChange, groupId, eventId }: Props) {
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!user || !name.trim() || amount <= 0) return
    setLoading(true)
    try {
      await addSponsor(groupId, eventId, { name: name.trim(), amount }, user.uid, user.displayName ?? 'Admin')
      toast({ title: 'Sponsor added' })
      setName(''); setAmount(0)
      onOpenChange(false)
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Add Sponsor">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Sponsor Name</Label>
          <Input placeholder="e.g. Birthday treat by Ramesh" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Amount (₹)</Label>
          <Input type="number" min={1} value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={loading || !name.trim() || amount <= 0}>
            {loading ? 'Adding…' : 'Add Sponsor'}
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  )
}
