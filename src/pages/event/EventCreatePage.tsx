import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import CreateEventStepper from '@/components/event-create/CreateEventStepper'
import Step1EventDetails from '@/components/event-create/Step1EventDetails'
import Step2Attendance from '@/components/event-create/Step2Attendance'
import Step3Expenses from '@/components/event-create/Step3Expenses'
import Step4Review from '@/components/event-create/Step4Review'
import { Button } from '@/components/ui/button'
import { ResponsiveDialog } from '@/components/shared/ResponsiveDialog'
import LoadingScreen from '@/components/layout/LoadingScreen'
import { useEventDraftStore } from '@/store/eventDraftStore'
import { useGroupStore } from '@/store/groupStore'
import { useDraftSave } from '@/hooks/useDraftSave'
import { getDraft } from '@/services/draft.service'
import { ROUTES } from '@/lib/constants'

export default function EventCreatePage() {
  const { currentStep, step1, reset, loadDraft } = useEventDraftStore()
  const { activeGroup } = useGroupStore()
  const { save, saving } = useDraftSave()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const draftParam = params.get('draft')

  const [hydrating, setHydrating] = useState(true)
  const [closePrompt, setClosePrompt] = useState(false)

  // Warn before leaving mid-wizard (browser navigation)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  // Start fresh, or resume a saved draft when ?draft=<id> is present
  useEffect(() => {
    let cancelled = false
    async function init() {
      if (draftParam && activeGroup) {
        const payload = await getDraft(activeGroup.id, draftParam)
        if (!cancelled) {
          if (payload) loadDraft(draftParam, payload)
          else reset()
          setHydrating(false)
        }
      } else {
        reset()
        setHydrating(false)
      }
    }
    init()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftParam, activeGroup?.id])

  const eventsRoute = ROUTES.GROUP_EVENTS(activeGroup?.id ?? '')

  const handleBack = () => {
    // Nothing entered yet → just leave. Otherwise offer to save as draft.
    if (!step1) { navigate(eventsRoute); return }
    setClosePrompt(true)
  }

  const discardAndLeave = () => {
    reset()
    setClosePrompt(false)
    navigate(eventsRoute)
  }

  if (hydrating) return <LoadingScreen />

  return (
    <div className="max-w-lg mx-auto flex flex-col h-screen md:h-auto">
      <PageHeader
        title={draftParam ? 'Resume Draft' : 'New Event'}
        onBack={handleBack}
      />
      <CreateEventStepper current={currentStep} />
      <div className="flex-1 overflow-y-auto md:overflow-visible">
        {currentStep === 1 && <Step1EventDetails />}
        {currentStep === 2 && <Step2Attendance />}
        {currentStep === 3 && <Step3Expenses />}
        {currentStep === 4 && <Step4Review />}
      </div>

      <ResponsiveDialog open={closePrompt} onOpenChange={setClosePrompt} title="Save as draft?">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You have unsaved changes. Save this event as a draft so you can finish it later?
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save Draft'}
            </Button>
            <Button variant="outline" onClick={discardAndLeave} disabled={saving}>
              Discard
            </Button>
            <Button variant="ghost" onClick={() => setClosePrompt(false)} disabled={saving}>
              Keep Editing
            </Button>
          </div>
        </div>
      </ResponsiveDialog>
    </div>
  )
}
