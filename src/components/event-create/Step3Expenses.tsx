import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEventDraftStore } from '@/store/eventDraftStore'
import { useGroupStore } from '@/store/groupStore'
import { useAuthStore } from '@/store/authStore'
import { createEvent } from '@/services/event.service'
import { EXPENSE_CATEGORIES, ROUTES } from '@/lib/constants'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { nanoid } from '@/lib/nanoid'

export default function Step3Expenses() {
  const { step1, attendance, expenses, setExpenses, setStep, reset } = useEventDraftStore()
  const { activeGroup } = useGroupStore()
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const addRow = () =>
    setExpenses([...expenses, { localId: nanoid(), vendor: '', category: 'venue', amount: 0, notes: '' }])

  const updateRow = (localId: string, field: string, value: string | number) =>
    setExpenses(expenses.map((e) => (e.localId === localId ? { ...e, [field]: value } : e)))

  const removeRow = (localId: string) =>
    setExpenses(expenses.filter((e) => e.localId !== localId))

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalRevenue = attendance.reduce((s, a) => s + a.songCount * (step1?.ratePerSong ?? 0), 0)

  const handleCreate = async () => {
    if (!step1 || !user || !activeGroup) return
    const validExpenses = expenses.filter((e) => e.vendor && e.amount > 0)
    setLoading(true)
    try {
      const eventId = await createEvent(
        activeGroup.id, step1, attendance, validExpenses, user.uid, user.displayName ?? 'Admin'
      )
      toast({ title: 'Event created!', description: `${step1.title} is ready.` })
      reset()
      navigate(ROUTES.EVENT_DETAIL(activeGroup.id, eventId))
    } catch {
      toast({ title: 'Error', description: 'Could not create event.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {expenses.map((e) => (
          <div key={e.localId} className="flex gap-2 items-start bg-muted/40 rounded-lg p-3">
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Vendor name"
                value={e.vendor}
                onChange={(ev) => updateRow(e.localId, 'vendor', ev.target.value)}
              />
              <div className="flex gap-2">
                <Select value={e.category} onValueChange={(v) => updateRow(e.localId, 'category', v)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={0}
                  placeholder="₹ Amount"
                  className="w-28"
                  value={e.amount || ''}
                  onChange={(ev) => updateRow(e.localId, 'amount', Number(ev.target.value))}
                />
              </div>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeRow(e.localId)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        <Button variant="outline" className="w-full gap-2" onClick={addRow}>
          <Plus className="w-4 h-4" /> Add Expense
        </Button>

        <div className="rounded-lg bg-muted/60 p-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Revenue ({attendance.length} singers)</span>
            <span className="font-medium text-success">{formatCurrency(totalRevenue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expenses ({expenses.length} items)</span>
            <span className="font-medium text-danger">{formatCurrency(totalExpenses)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
            <span>Net</span>
            <span className={totalRevenue - totalExpenses >= 0 ? 'text-success' : 'text-danger'}>
              {formatCurrency(totalRevenue - totalExpenses)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => setStep(2)} disabled={loading}>
          Back
        </Button>
        <Button className="flex-1" onClick={handleCreate} disabled={loading}>
          {loading ? 'Creating…' : 'Create Event'}
        </Button>
      </div>
    </div>
  )
}
