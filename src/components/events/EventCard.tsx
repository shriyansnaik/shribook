import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Users, ChevronRight, Trash2, Pencil } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import EventStatusBadge from './EventStatusBadge'
import CurrencyDisplay from '@/components/shared/CurrencyDisplay'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { deleteDraft } from '@/services/draft.service'
import { useToast } from '@/hooks/use-toast'
import { ROUTES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { Event } from '@/types'

interface Props {
  event: Event
  groupId: string
}

export default function EventCard({ event, groupId }: Props) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const isDraft = event.status === 'draft'

  const open = () => {
    if (isDraft) navigate(`${ROUTES.EVENT_CREATE(groupId)}?draft=${event.id}`)
    else navigate(ROUTES.EVENT_DETAIL(groupId, event.id))
  }

  const handleDiscard = async () => {
    setDiscarding(true)
    try {
      await deleteDraft(groupId, event.id)
      toast({ title: 'Draft discarded' })
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setDiscarding(false)
      setConfirmDiscard(false)
    }
  }

  return (
    <>
      <Card
        className="cursor-pointer transition-all hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99]"
        onClick={open}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{event.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{formatDate(event.date)}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {event.eventType === 'special' && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">Special</span>
              )}
              <EventStatusBadge status={event.status} />
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {event.venue}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {event.attendingCount} singers
            </span>
          </div>

          {isDraft ? (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Pencil className="w-3 h-3" /> Tap to continue editing
              </span>
              <Button
                variant="ghost" size="sm"
                className="h-7 gap-1 text-muted-foreground hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); setConfirmDiscard(true) }}
              >
                <Trash2 className="w-3.5 h-3.5" /> Discard
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-xs">
                <span className="text-muted-foreground">
                  In: <span className="font-medium text-success">{formatCurrency(event.totalRevenue + (event.totalSponsors ?? 0))}</span>
                </span>
                <span className="text-muted-foreground">
                  Out: <span className="font-medium text-danger">{formatCurrency(event.totalExpenses)}</span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Net:</span>
                <CurrencyDisplay amount={event.netAmount} showSign size="sm" />
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard draft?"
        description={`"${event.title}" will be permanently deleted.`}
        confirmLabel="Discard"
        variant="destructive"
        onConfirm={handleDiscard}
        loading={discarding}
      />
    </>
  )
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}
