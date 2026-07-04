import { cn } from '@/lib/utils'
import { useEventDraftStore, type WizardStep } from '@/store/eventDraftStore'

const steps = ['Details', 'Singers', 'Expenses', 'Review']

export default function CreateEventStepper({ current }: { current: WizardStep }) {
  const { step1, attendance, setStep } = useEventDraftStore()

  // A step is reachable once its prerequisites exist — mirrors the Next buttons:
  // Details is always open; Details must be saved for Singers; and at least one
  // singer is needed before Expenses / Review.
  const reachable = (step: number) => {
    if (step === 1) return true
    if (step === 2) return step1 !== null
    return step1 !== null && attendance.length > 0
  }

  const go = (step: WizardStep) => {
    if (step !== current && reachable(step)) setStep(step)
  }

  return (
    <div className="flex items-center px-4 py-3 gap-0">
      {steps.map((label, i) => {
        const step = (i + 1) as WizardStep
        const done = step < current
        const active = step === current
        const canGo = reachable(step) && !active

        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => go(step)}
                disabled={!reachable(step)}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors',
                  done && 'bg-navy border-navy text-white',
                  active && 'border-navy text-navy bg-white',
                  !done && !active && 'border-muted text-muted-foreground bg-white',
                  canGo && 'cursor-pointer hover:border-navy hover:text-navy',
                  !reachable(step) && 'cursor-not-allowed opacity-50',
                )}
              >
                {done ? '✓' : step}
              </button>
              <button
                type="button"
                onClick={() => go(step)}
                disabled={!reachable(step)}
                className={cn(
                  'text-[10px] mt-1 font-medium bg-transparent transition-colors',
                  active ? 'text-navy' : 'text-muted-foreground',
                  canGo && 'hover:text-navy cursor-pointer',
                  !reachable(step) && 'cursor-not-allowed',
                )}
              >
                {label}
              </button>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('flex-1 h-px mx-2 mb-4', done ? 'bg-navy' : 'bg-border')} />
            )}
          </div>
        )
      })}
    </div>
  )
}
