import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Shield, Trash2, UserPlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import PageHeader from '@/components/layout/PageHeader'
import { updateGroup, addAdminToGroup, removeAdminFromGroup } from '@/services/group.service'
import { useGroupStore } from '@/store/groupStore'
import { useAuthStore } from '@/store/authStore'
import { groupSchema, type GroupFormValues } from '@/lib/validators'
import { useToast } from '@/hooks/use-toast'

export default function SettingsPage() {
  const { activeGroup, userRole } = useGroupStore()
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()
  const [savingGroup, setSavingGroup] = useState(false)
  const [newAdminUid, setNewAdminUid] = useState('')
  const [addingAdmin, setAddingAdmin] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    values: activeGroup ? { name: activeGroup.name, defaultRatePerSong: activeGroup.defaultRatePerSong } : undefined,
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

  const handleAddAdmin = async () => {
    if (!activeGroup || !newAdminUid.trim()) return
    setAddingAdmin(true)
    try {
      await addAdminToGroup(activeGroup.id, newAdminUid.trim())
      toast({ title: 'Admin added' })
      setNewAdminUid('')
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setAddingAdmin(false)
    }
  }

  const handleRemoveAdmin = async (uid: string) => {
    if (!activeGroup) return
    if (activeGroup.admins.length <= 1) {
      toast({ title: 'Cannot remove the only admin', variant: 'destructive' })
      return
    }
    try {
      await removeAdminFromGroup(activeGroup.id, uid)
      toast({ title: 'Admin removed' })
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    }
  }

  const isAdmin = userRole === 'admin'

  return (
    <div className="max-w-lg mx-auto">
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
                <Label>Default Rate per Song (₹)</Label>
                <Input type="number" {...register('defaultRatePerSong')} disabled={!isAdmin} />
                <p className="text-xs text-muted-foreground">Applied to new events by default</p>
                {errors.defaultRatePerSong && <p className="text-xs text-destructive">{errors.defaultRatePerSong.message}</p>}
              </div>
              {isAdmin && (
                <Button type="submit" disabled={savingGroup}>
                  {savingGroup ? 'Saving…' : 'Save Changes'}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-navy" /> Admins ({activeGroup?.admins.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {activeGroup?.admins.map((uid) => (
                <div key={uid} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-navy">A</span>
                  </div>
                  <span className="text-sm flex-1 truncate font-mono text-muted-foreground">{uid}</span>
                  {uid === user?.uid && <Badge variant="secondary" className="text-[10px]">You</Badge>}
                  {isAdmin && uid !== user?.uid && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveAdmin(uid)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {isAdmin && (
              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="Firebase UID of new admin"
                  value={newAdminUid}
                  onChange={(e) => setNewAdminUid(e.target.value)}
                  className="font-mono text-xs"
                />
                <Button size="sm" onClick={handleAddAdmin} disabled={addingAdmin || !newAdminUid.trim()}>
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Admins can manage events, members, and approve locked edits. Your UID: <span className="font-mono">{user?.uid}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
