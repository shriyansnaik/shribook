import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PageHeader from '@/components/layout/PageHeader'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { updateGroup, deleteGroup } from '@/services/group.service'
import { useGroupStore } from '@/store/groupStore'
import { groupSchema, type GroupFormValues } from '@/lib/validators'
import { useToast } from '@/hooks/use-toast'
import { ROUTES } from '@/lib/constants'

export default function SettingsPage() {
  const { activeGroup, userRole } = useGroupStore()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [savingGroup, setSavingGroup] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    values: activeGroup ? { name: activeGroup.name, openingBalance: activeGroup.openingBalance ?? 0 } : undefined,
  })

  const onSaveGroup = async (data: GroupFormValues) => {
    if (!activeGroup) return
    setSavingGroup(true)
    try {
      await updateGroup(activeGroup.id, data)
      toast({ title: 'Settings saved' })
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setSavingGroup(false)
    }
  }

  const handleDeleteGroup = async () => {
    if (!activeGroup) return
    setDeleting(true)
    try {
      await deleteGroup(activeGroup.id)
      navigate(ROUTES.GROUPS)
    } catch {
      toast({ title: 'Error deleting group', variant: 'destructive' })
      setDeleting(false)
    }
  }

  const isAdmin = userRole === 'admin'

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Settings" />
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Group Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSaveGroup)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Group Name</Label>
                <Input {...register('name')} disabled={!isAdmin} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Opening Balance (₹)</Label>
                <Input type="number" min={0} {...register('openingBalance')} disabled={!isAdmin} />
                <p className="text-xs text-muted-foreground">Carried-over profit added to the dashboard total.</p>
                {errors.openingBalance && <p className="text-xs text-destructive">{errors.openingBalance.message}</p>}
              </div>
              {isAdmin && (
                <Button type="submit" disabled={savingGroup}>
                  {savingGroup ? 'Saving…' : 'Save Changes'}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="border-destructive/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Delete this group</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Permanently deletes all events, members, and data. This cannot be undone.
                  </p>
                </div>
                <Button variant="destructive" size="sm" className="shrink-0" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete "${activeGroup?.name}"?`}
        description="This will permanently delete all events, members, expenses, and activity logs for this group. This cannot be undone."
        confirmLabel="Delete Group"
        variant="destructive"
        onConfirm={handleDeleteGroup}
        loading={deleting}
      />
    </div>
  )
}
