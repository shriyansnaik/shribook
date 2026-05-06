import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ResponsiveDialog } from '@/components/shared/ResponsiveDialog'
import { addMember, updateMember, bulkAddMembers } from '@/services/member.service'
import { memberSchema, type MemberFormValues } from '@/lib/validators'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import type { Member } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  groupId: string
  editing?: Member
}

export default function MemberFormDialog({ open, onOpenChange, groupId, editing }: Props) {
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [bulkText, setBulkText] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    values: editing ? { name: editing.name, phone: editing.phone ?? '', email: editing.email ?? '' } : undefined,
  })

  const onSubmit = async (data: MemberFormValues) => {
    if (!user) return
    setLoading(true)
    try {
      if (editing) {
        await updateMember(groupId, editing.id, { name: data.name, phone: data.phone || null, email: data.email || null })
        toast({ title: 'Member updated' })
      } else {
        await addMember(groupId, data, user.uid)
        toast({ title: 'Member added' })
      }
      reset()
      onOpenChange(false)
    } catch {
      toast({ title: 'Error', description: 'Could not save member.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleBulkImport = async () => {
    if (!user) return
    const names = bulkText.split('\n').map((n) => n.trim()).filter(Boolean)
    if (!names.length) return
    setLoading(true)
    try {
      await bulkAddMembers(groupId, names, user.uid)
      toast({ title: `${names.length} member${names.length > 1 ? 's' : ''} added` })
      setBulkText('')
      onOpenChange(false)
    } catch {
      toast({ title: 'Error', description: 'Import failed.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit Member' : 'Add Member'}
    >
      {editing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <SingleMemberFields register={register} errors={errors} />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Saving…' : 'Save Changes'}
          </Button>
        </form>
      ) : (
        <Tabs defaultValue="single">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="single" className="flex-1">Single</TabsTrigger>
            <TabsTrigger value="bulk" className="flex-1">Bulk Import</TabsTrigger>
          </TabsList>
          <TabsContent value="single">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <SingleMemberFields register={register} errors={errors} />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Adding…' : 'Add Member'}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="bulk" className="space-y-4">
            <div className="space-y-1.5">
              <Label>Paste Names (one per line)</Label>
              <Textarea
                rows={8}
                placeholder={"Rahul Sharma\nPriya Mehta\nAmit Patel"}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {bulkText.split('\n').filter((n) => n.trim()).length} names detected
              </p>
            </div>
            <Button className="w-full" onClick={handleBulkImport} disabled={loading || !bulkText.trim()}>
              {loading ? 'Importing…' : 'Import Members'}
            </Button>
          </TabsContent>
        </Tabs>
      )}
    </ResponsiveDialog>
  )
}

function SingleMemberFields({ register, errors }: { register: ReturnType<typeof useForm<MemberFormValues>>['register']; errors: Record<string, { message?: string } | undefined> }) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="mname">Name *</Label>
        <Input id="mname" placeholder="Full name" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="mphone">Phone (optional)</Label>
        <Input id="mphone" type="tel" placeholder="+91 98765 43210" {...register('phone')} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="memail">Email (optional)</Label>
        <Input id="memail" type="email" placeholder="name@example.com" {...register('email')} />
      </div>
    </>
  )
}
