import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/store/authStore'
import { createGroup } from '@/services/group.service'
import { groupSchema, type GroupFormValues } from '@/lib/validators'
import { ResponsiveDialog } from '@/components/shared/ResponsiveDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export default function CreateGroupDialog({ open, onOpenChange }: Props) {
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: { defaultRatePerSong: 600 },
  })

  const onSubmit = async (data: GroupFormValues) => {
    if (!user) return
    setLoading(true)
    try {
      await createGroup(data, user.uid, user.displayName ?? user.email ?? 'Admin')
      toast({ title: 'Group created!', description: `"${data.name}" is ready.` })
      reset()
      onOpenChange(false)
    } catch {
      toast({ title: 'Error', description: 'Could not create group.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Create Group">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Group Name</Label>
          <Input id="name" placeholder="e.g. Dad's Singing Circle" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rate">Default Rate per Song (₹)</Label>
          <Input id="rate" type="number" min={1} {...register('defaultRatePerSong')} />
          {errors.defaultRatePerSong && (
            <p className="text-xs text-destructive">{errors.defaultRatePerSong.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Can be overridden per event
          </p>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating…' : 'Create Group'}
        </Button>
      </form>
    </ResponsiveDialog>
  )
}
