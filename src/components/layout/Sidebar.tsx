import { NavLink, useParams, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, Users, Settings, ChevronLeft, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useGroupStore } from '@/store/groupStore'
import { signOut } from '@/services/auth.service'
import { Button } from '@/components/ui/button'
import { BrandLockup } from '@/components/shared/Logo'

const items = [
  { label: 'Dashboard', icon: LayoutDashboard, to: (id: string) => ROUTES.GROUP_DASHBOARD(id) },
  { label: 'Events', icon: CalendarDays, to: (id: string) => ROUTES.GROUP_EVENTS(id) },
  { label: 'Members', icon: Users, to: (id: string) => ROUTES.GROUP_MEMBERS(id) },
  { label: 'Settings', icon: Settings, to: (id: string) => ROUTES.GROUP_SETTINGS(id) },
]

export default function Sidebar() {
  const { groupId } = useParams<{ groupId: string }>()
  const { activeGroup } = useGroupStore()
  const navigate = useNavigate()
  if (!groupId) return null

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border bg-card h-screen sticky top-0">
      <div className="border-b border-border">
        <div className="px-4 pt-4 pb-3">
          <BrandLockup boxed textClassName="text-sm" />
        </div>
        <div className="px-4 pb-3 flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground shrink-0">
            Group
          </span>
          <span className="font-semibold text-sm text-foreground truncate">
            {activeGroup?.name ?? 'Loading…'}
          </span>
        </div>
      </div>

      <nav className="flex flex-col gap-1 p-3 flex-1">
        {items.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={label}
            to={to(groupId)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-navy text-white'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border flex flex-col gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-2 text-muted-foreground"
          onClick={() => navigate(ROUTES.GROUPS)}
        >
          <ChevronLeft className="w-4 h-4" /> All Groups
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-2 text-muted-foreground"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </div>
    </aside>
  )
}
