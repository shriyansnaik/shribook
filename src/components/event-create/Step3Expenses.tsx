import { Plus, Trash2, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEventDraftStore } from '@/store/eventDraftStore'
import { useDraftSave } from '@/hooks/useDraftSave'
import { nanoid } from '@/lib/nanoid'

export default function Step3Expenses() {
  const { expenses, setExpenses, sponsors, setSponsors, setStep } = useEventDraftStore()
  const { save, saving } = useDraftSave()

  const addExpense = () =>
    setExpenses([...expenses, { localId: nanoid(), vendor: '', amount: 0 }])
  const updateExpense = (localId: string, field: string, value: string | number) =>
    setExpenses(expenses.map((e) => (e.localId === localId ? { ...e, [field]: value } : e)))
  const removeExpense = (localId: string) =>
    setExpenses(expenses.filter((e) => e.localId !== localId))

  const addSponsor = () =>
    setSponsors([...sponsors, { localId: nanoid(), name: '', amount: 0 }])
  const updateSponsor = (localId: string, field: string, value: string | number) =>
    setSponsors(sponsors.map((s) => (s.localId === localId ? { ...s, [field]: value } : s)))
  const removeSponsor = (localId: string) =>
    setSponsors(sponsors.filter((s) => s.localId !== localId))

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Expenses */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Expenses</h3>
          {expenses.map((e) => (
            <div key={e.localId} className="flex gap-2 items-center bg-muted/40 rounded-lg p-3">
              <Input
                placeholder="Expense name"
                className="flex-1"
                value={e.vendor}
                onChange={(ev) => updateExpense(e.localId, 'vendor', ev.target.value)}
              />
              <Input
                type="number" min={0} placeholder="₹ Amount" className="w-28"
                value={e.amount || ''}
                onChange={(ev) => updateExpense(e.localId, 'amount', Number(ev.target.value))}
              />
              <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeExpense(e.localId)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" className="w-full gap-2" onClick={addExpense}>
            <Plus className="w-4 h-4" /> Add Expense
          </Button>
        </div>

        {/* Sponsors */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Gift className="w-4 h-4 text-gold" /> Sponsors
          </h3>
          <p className="text-xs text-muted-foreground -mt-1.5">
            Contributions (birthday treat, a sponsor, etc.) that add to the event's income.
          </p>
          {sponsors.map((s) => (
            <div key={s.localId} className="flex gap-2 items-center bg-muted/40 rounded-lg p-3">
              <Input
                placeholder="Sponsor name"
                className="flex-1"
                value={s.name}
                onChange={(ev) => updateSponsor(s.localId, 'name', ev.target.value)}
              />
              <Input
                type="number" min={0} placeholder="₹ Amount" className="w-28"
                value={s.amount || ''}
                onChange={(ev) => updateSponsor(s.localId, 'amount', Number(ev.target.value))}
              />
              <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeSponsor(s.localId)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" className="w-full gap-2" onClick={addSponsor}>
            <Plus className="w-4 h-4" /> Add Sponsor
          </Button>
        </div>
      </div>

      <div className="p-4 border-t border-border flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => setStep(2)} disabled={saving}>
          Back
        </Button>
        <Button variant="ghost" className="shrink-0" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Draft'}
        </Button>
        <Button className="flex-1" onClick={() => setStep(4)}>
          Next: Review
        </Button>
      </div>
    </div>
  )
}
