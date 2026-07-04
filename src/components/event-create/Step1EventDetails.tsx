import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEventDraftStore } from '@/store/eventDraftStore'
import { eventStep1Schema, type EventStep1Values } from '@/lib/validators'
import type { EventType } from '@/types'

export default function Step1EventDetails() {
  const { step1, setStep1, setStep } = useEventDraftStore()
  const [eventType, setEventType] = useState<EventType>(step1?.eventType ?? 'regular')

  const { register, handleSubmit, formState: { errors } } = useForm<EventStep1Values>({
    resolver: zodResolver(eventStep1Schema),
    defaultValues: step1 ?? {
      title: '', date: '', venue: '', description: undefined,
      ratePerSong: 600, guestFee: 0,
    },
  })

  const onSubmit = (data: EventStep1Values) => {
    setStep1({
      ...data,
      eventType,
      ratePerSong: Number(data.ratePerSong),
      guestFee: Number(data.guestFee),
    })
    setStep(2)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Event Name *</Label>
        <Input id="title" placeholder="e.g. Monthly Singing Night – June" {...register('title')} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Event Type *</Label>
        <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="regular">Regular</SelectItem>
            <SelectItem value="special">Special Event</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="date">Date *</Label>
        <Input id="date" type="date" {...register('date')} />
        {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="venue">Venue *</Label>
        <Input id="venue" placeholder="e.g. Shree Hall, Bandra" {...register('venue')} />
        {errors.venue && <p className="text-xs text-destructive">{errors.venue.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rate">Rate per Song (₹) *</Label>
        <Input id="rate" type="number" min={1} {...register('ratePerSong')} />
        {errors.ratePerSong && <p className="text-xs text-destructive">{errors.ratePerSong.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="guestFee">Guest Fee (₹)</Label>
        <Input id="guestFee" type="number" min={0} {...register('guestFee')} />
        <p className="text-xs text-muted-foreground">Charged per guest a singer brings. Leave 0 if guests are free.</p>
        {errors.guestFee && <p className="text-xs text-destructive">{errors.guestFee.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="desc">Description (optional)</Label>
        <Textarea id="desc" placeholder="Theme, notes, special guests…" rows={3} {...register('description')} />
      </div>

      <Button type="submit" className="w-full">Next: Select Singers</Button>
    </form>
  )
}
