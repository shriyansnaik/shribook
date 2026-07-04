import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEventDraftStore } from '@/store/eventDraftStore'
import { useGroupStore } from '@/store/groupStore'
import { useAuthStore } from '@/store/authStore'
import { saveDraft } from '@/services/draft.service'
import { useToast } from '@/hooks/use-toast'
import { ROUTES } from '@/lib/constants'

// Shared "Save as Draft" action for the create-event wizard. Persists the
// current wizard state and leaves the flow.
export function useDraftSave() {
  const { activeGroup } = useGroupStore()
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const canSave = !!useEventDraftStore((s) => s.step1)

  const save = async () => {
    const { step1, attendance, expenses, sponsors, draftId, reset } = useEventDraftStore.getState()
    if (!step1 || !activeGroup || !user) return
    setSaving(true)
    try {
      await saveDraft(activeGroup.id, draftId, { step1, attendance, expenses, sponsors }, user.uid)
      toast({ title: 'Draft saved', description: 'Find it in your events list to finish later.' })
      reset()
      navigate(ROUTES.GROUP_EVENTS(activeGroup.id))
    } catch {
      toast({ title: 'Error', description: 'Could not save draft.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return { save, saving, canSave }
}
