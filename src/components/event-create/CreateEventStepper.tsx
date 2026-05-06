import { cn } from '@/lib/utils'

const steps = ['Event Details', 'Attendance', 'Expenses']

export default function CreateEventStepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center px-4 py-3 gap-0">
      {steps.map((label, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors',
                  done && 'bg-navy border-navy text-white',
                  active && 'border-navy text-navy bg-white',
                  !done && !active && 'border-muted text-muted-foreground bg-white'
                )}
              >
                {done ? '✓' : step}
              </div>
              <span className={cn('text-[10px] mt-1 font-medium', active ? 'text-navy' : 'text-muted-foreground')}>
                {label}
              </span>
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
