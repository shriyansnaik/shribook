import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ResponsiveDialog } from '@/components/shared/ResponsiveDialog'
import { updateEventDetails } from '@/services/event.service'
import { eventStep1Schema, type EventStep1Values } from '@/lib/validators'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import type { Event, EventType } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  groupId: string
  event: Event
}

function toISODate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function EditEventDetailsDialog({ open, onOpenChange, groupId, event }: Props) {
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [eventType, setEventType] = useState<EventType>(event.eventType)

  const { register, handleSubmit, formState: { errors } } = useForm<EventStep1Values>({
    resolver: zodResolver(eventStep1Schema),
    values: {
      title: event.title,
      date: toISODate(event.date.toDate()),
      venue: event.venue,
      description: event.description ?? '',
      ratePerSong: event.ratePerSong,
      guestFee: event.guestFee ?? 0,
    },
  })

  const onSubmit = async (data: EventStep1Values) => {
    if (!user) return
    setLoading(true)
    try {
      await updateEventDetails(
        groupId, event.id,
        {
          title: data.title, date: data.date, venue: data.venue, description: data.description,
          eventType, ratePerSong: Number(data.ratePerSong), guestFee: Number(data.guestFee),
        },
        { title: event.title, venue: event.venue, eventType: event.eventType, ratePerSong: event.ratePerSong, guestFee: event.guestFee ?? 0 },
        user.uid, user.displayName ?? 'Admin'
      )
      toast({ title: 'Event updated', description: 'Amounts were recalculated where needed.' })
      onOpenChange(false)
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Edit Event Details">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Event Name</Label>
          <Input {...register('title')} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Event Type</Label>
          <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="special">Special Event</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input type="date" {...register('date')} />
          {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Venue</Label>
          <Input {...register('venue')} />
          {errors.venue && <p className="text-xs text-destructive">{errors.venue.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Rate / Song (₹)</Label>
            <Input type="number" min={1} {...register('ratePerSong')} />
            {errors.ratePerSong && <p className="text-xs text-destructive">{errors.ratePerSong.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Guest Fee (₹)</Label>
            <Input type="number" min={0} {...register('guestFee')} />
            {errors.guestFee && <p className="text-xs text-destructive">{errors.guestFee.message}</p>}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Description (optional)</Label>
          <Textarea rows={2} {...register('description')} />
        </div>
        <p className="text-xs text-muted-foreground">
          Changing the rate or guest fee re-calculates every singer's amount automatically.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={loading}>{loading ? 'Saving…' : 'Save'}</Button>
        </div>
      </form>
    </ResponsiveDialog>
  )
}
