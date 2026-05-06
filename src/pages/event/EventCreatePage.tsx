import { useEffect } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import CreateEventStepper from '@/components/event-create/CreateEventStepper'
import Step1EventDetails from '@/components/event-create/Step1EventDetails'
import Step2Attendance from '@/components/event-create/Step2Attendance'
import Step3Expenses from '@/components/event-create/Step3Expenses'
import { useEventDraftStore } from '@/store/eventDraftStore'
import { useGroupStore } from '@/store/groupStore'
import { ROUTES } from '@/lib/constants'

export default function EventCreatePage() {
  const { currentStep, reset } = useEventDraftStore()
  const { activeGroup } = useGroupStore()

  // Warn before leaving mid-wizard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  // Reset draft on mount so we always start fresh
  useEffect(() => { reset() }, [reset])

  return (
    <div className="max-w-lg mx-auto flex flex-col h-screen md:h-auto">
      <PageHeader
        title="New Event"
        backTo={ROUTES.GROUP_EVENTS(activeGroup?.id ?? '')}
      />
      <CreateEventStepper current={currentStep} />
      <div className="flex-1 overflow-y-auto md:overflow-visible">
        {currentStep === 1 && <Step1EventDetails />}
        {currentStep === 2 && <Step2Attendance />}
        {currentStep === 3 && <Step3Expenses />}
      </div>
    </div>
  )
}
