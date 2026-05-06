import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import AttendeeRow from './AttendeeRow'
import EmptyState from '@/components/shared/EmptyState'
import { useEventDraftStore } from '@/store/eventDraftStore'
import { useGroupStore } from '@/store/groupStore'
import { Users } from 'lucide-react'

export default function Step2Attendance() {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | 'attending'>('all')
  const { attendance, setStep } = useEventDraftStore()
  const { members } = useGroupStore()

  const query = search.toLowerCase()
  const allFiltered = members.filter((m) => m.name.toLowerCase().includes(query))
  const attendingFiltered = members.filter(
    (m) =>
      attendance.some((a) => a.memberId === m.id) &&
      m.name.toLowerCase().includes(query)
  )

  const displayed = tab === 'all' ? allFiltered : attendingFiltered

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search members…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'all' | 'attending')}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              All ({members.length})
            </TabsTrigger>
            <TabsTrigger value="attending" className="flex-1">
              Attending ({attendance.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        {displayed.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6 text-muted-foreground" />}
            title={tab === 'attending' ? 'No singers selected yet' : 'No members found'}
            description={tab === 'attending' ? 'Toggle members from the All tab' : undefined}
          />
        ) : (
          displayed.map((m) => <AttendeeRow key={m.id} member={m} />)
        )}
      </ScrollArea>

      <div className="p-4 border-t border-border flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
          Back
        </Button>
        <Button
          className="flex-1"
          onClick={() => setStep(3)}
          disabled={attendance.length === 0}
        >
          Next: Expenses
        </Button>
      </div>
    </div>
  )
}
