import { useNavigate } from 'react-router-dom'
import { Users, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ROUTES } from '@/lib/constants'
import { useAuthStore } from '@/store/authStore'
import type { Group } from '@/types'

interface GroupCardProps {
  group: Group
}

export default function GroupCard({ group }: GroupCardProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user ? group.admins.includes(user.uid) : false

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99]"
      onClick={() => navigate(ROUTES.GROUP_DASHBOARD(group.id))}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div className="w-11 h-11 rounded-xl bg-navy/10 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-navy" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground truncate">{group.name}</p>
            {isAdmin && (
              <Badge variant="secondary" className="text-[10px] shrink-0">Admin</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {group.members.length} member{group.members.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </CardContent>
    </Card>
  )
}
