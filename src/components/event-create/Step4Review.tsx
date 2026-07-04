import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, MapPin, Music, Users, Gift, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useEventDraftStore } from '@/store/eventDraftStore'
import { useGroupStore } from '@/store/groupStore'
import { useAuthStore } from '@/store/authStore'
import { useDraftSave } from '@/hooks/useDraftSave'
import { createEvent } from '@/services/event.service'
import { deleteDraft } from '@/services/draft.service'
import { computeRowEarnings, computeNetAmount } from '@/lib/earnings'
import { ROUTES } from '@/lib/constants'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'

function Line({ label, value, tone }: { label: string; value: string; tone?: 'success' | 'danger' }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium tabular-nums ${tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : ''}`}>{value}</span>
    </div>
  )
}

export default function Step4Review() {
  const { step1, attendance, expenses, sponsors, draftId, setStep, reset } = useEventDraftStore()
  const { activeGroup } = useGroupStore()
  const user = useAuthStore((s) => s.user)
  const { save, saving } = useDraftSave()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  if (!step1) return null

  const totalRevenue = attendance.reduce((s, a) => s + computeRowEarnings({
    isFounder: a.isFounder, songCount: a.songCount, guestCount: a.guestCount,
    ratePerSong: step1.ratePerSong, guestFee: step1.guestFee,
  }), 0)
  const totalSponsors = sponsors.reduce((s, sp) => s + Number(sp.amount || 0), 0)
  const validExpenses = expenses.filter((e) => e.vendor && Number(e.amount) > 0)
  const validSponsors = sponsors.filter((s) => s.name && Number(s.amount) > 0)
  const totalExpenses = validExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const net = computeNetAmount(totalRevenue, totalSponsors, totalExpenses)

  const handleCreate = async () => {
    if (!step1 || !user || !activeGroup) return
    setLoading(true)
    try {
      const eventId = await createEvent(
        activeGroup.id, step1, attendance, validExpenses, validSponsors, user.uid, user.displayName ?? 'Admin'
      )
      if (draftId) await deleteDraft(activeGroup.id, draftId)
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Details */}
        <div className="rounded-lg border border-border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground">{step1.title}</p>
            {step1.eventType === 'special' && <Badge className="bg-gold/15 text-gold border-gold/30 text-[10px]">Special</Badge>}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{step1.date}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{step1.venue}</span>
            <span className="flex items-center gap-1"><Music className="w-3.5 h-3.5" />₹{step1.ratePerSong}/song · ₹{step1.guestFee}/guest</span>
          </div>
        </div>

        {/* Singers */}
        <div className="rounded-lg border border-border">
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border text-sm font-medium">
            <Users className="w-4 h-4 text-navy" /> Singers ({attendance.length})
          </div>
          {attendance.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">No singers added.</p>
          ) : (
            <div className="divide-y divide-border">
              {attendance.map((a) => (
                <div key={a.memberId} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="truncate">
                    {a.memberName}
                    <span className="text-xs text-muted-foreground ml-1.5">
                      {a.songCount} song{a.songCount === 1 ? '' : 's'}{a.guestCount > 0 ? ` · ${a.guestCount} guest${a.guestCount === 1 ? '' : 's'}` : ''}
                    </span>
                  </span>
                  <span className="font-medium tabular-nums text-success">
                    {formatCurrency(computeRowEarnings({
                      isFounder: a.isFounder, songCount: a.songCount, guestCount: a.guestCount,
                      ratePerSong: step1.ratePerSong, guestFee: step1.guestFee,
                    }))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sponsors */}
        {validSponsors.length > 0 && (
          <div className="rounded-lg border border-border">
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border text-sm font-medium">
              <Gift className="w-4 h-4 text-gold" /> Sponsors ({validSponsors.length})
            </div>
            <div className="divide-y divide-border">
              {validSponsors.map((s) => (
                <div key={s.localId} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="truncate">{s.name}</span>
                  <span className="font-medium tabular-nums text-success">{formatCurrency(Number(s.amount))}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expenses */}
        {validExpenses.length > 0 && (
          <div className="rounded-lg border border-border">
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border text-sm font-medium">
              <Receipt className="w-4 h-4 text-navy" /> Expenses ({validExpenses.length})
            </div>
            <div className="divide-y divide-border">
              {validExpenses.map((e) => (
                <div key={e.localId} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="truncate">{e.vendor}</span>
                  <span className="font-medium tabular-nums text-danger">{formatCurrency(Number(e.amount))}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="rounded-lg bg-muted/60 p-4 space-y-1.5">
          <Line label="Singer revenue" value={formatCurrency(totalRevenue)} tone="success" />
          {totalSponsors > 0 && <Line label="Sponsors" value={formatCurrency(totalSponsors)} tone="success" />}
          <Line label="Expenses" value={formatCurrency(totalExpenses)} tone="danger" />
          <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
            <span>Net</span>
            <span className={net >= 0 ? 'text-success' : 'text-danger'}>{formatCurrency(net)}</span>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => setStep(3)} disabled={loading || saving}>
          Back
        </Button>
        <Button variant="ghost" className="shrink-0" onClick={save} disabled={loading || saving}>
          {saving ? 'Saving…' : 'Save Draft'}
        </Button>
        <Button className="flex-1" onClick={handleCreate} disabled={loading || attendance.length === 0}>
          {loading ? 'Creating…' : 'Create Event'}
        </Button>
      </div>
    </div>
  )
}
