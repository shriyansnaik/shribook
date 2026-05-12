import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ResponsiveDialog } from '@/components/shared/ResponsiveDialog'
import { parseBulkAttendees, type ParsedAttendee } from '@/services/groq.service'
import { useToast } from '@/hooks/use-toast'
import type { Member } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  members: Member[]
  onImport: (items: ParsedAttendee[]) => Promise<void>
}

export default function BulkAttendeeImportDialog({ open, onOpenChange, members, onImport }: Props) {
  const { toast } = useToast()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [unmatched, setUnmatched] = useState<string[]>([])
  const [phase, setPhase] = useState<'input' | 'result'>('input')

  const handleClose = () => {
    setText('')
    setUnmatched([])
    setPhase('input')
    onOpenChange(false)
  }

  const handleImport = async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      const { matched, unmatched: um } = await parseBulkAttendees(
        text,
        members.map((m) => ({ id: m.id, name: m.name }))
      )
      if (matched.length > 0) await onImport(matched)
      if (um.length > 0) {
        setUnmatched(um)
        setPhase('result')
      } else {
        handleClose()
      }
    } catch {
      toast({ title: 'Import failed', description: 'Could not process the list.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleClose} title="Bulk Import Singers">
      {phase === 'input' ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Paste singer list</Label>
            <Textarea
              rows={8}
              placeholder={"1. Rahul 3\n2. Priya Mehta 2\n3. Amit"}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Format: name followed by number of songs (optional, defaults to 1)
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleImport} disabled={loading || !text.trim()}>
              {loading ? 'Processing…' : 'Import'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">
                Could not match the following — please add them manually
              </p>
              <ul className="space-y-0.5">
                {unmatched.map((name, i) => (
                  <li key={i} className="text-sm text-destructive/80">{name}</li>
                ))}
              </ul>
            </div>
          </div>
          <Button className="w-full" onClick={handleClose}>
            Done
          </Button>
        </div>
      )}
    </ResponsiveDialog>
  )
}
