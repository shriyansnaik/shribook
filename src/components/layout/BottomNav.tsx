import { NavLink, useParams } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, Users, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'

const items = [
  { label: 'Dashboard', icon: LayoutDashboard, to: (id: string) => ROUTES.GROUP_DASHBOARD(id) },
  { label: 'Events', icon: CalendarDays, to: (id: string) => ROUTES.GROUP_EVENTS(id) },
  { label: 'Members', icon: Users, to: (id: string) => ROUTES.GROUP_MEMBERS(id) },
  { label: 'Settings', icon: Settings, to: (id: string) => ROUTES.GROUP_SETTINGS(id) },
]

export default function BottomNav() {
  const { groupId } = useParams<{ groupId: string }>()
  if (!groupId) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex">
        {items.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={label}
            to={to(groupId)}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                isActive ? 'text-navy' : 'text-muted-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
