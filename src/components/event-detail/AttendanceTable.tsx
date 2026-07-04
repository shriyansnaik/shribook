import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import type { Attendance } from '@/types'

export default function AttendanceTable({ attendance }: { attendance: Attendance[] }) {
  const attending = attendance.filter((a) => a.status === 'attending')
  const cancelled = attendance.filter((a) => a.status === 'cancelled')

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Singers ({attending.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Name</th>
              <th className="text-center px-2 py-2 text-xs text-muted-foreground font-medium">Songs</th>
              <th className="text-center px-2 py-2 text-xs text-muted-foreground font-medium">Guests</th>
              <th className="text-right px-4 py-2 text-xs text-muted-foreground font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {attending.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 font-medium">
                  {a.memberName}
                  {a.isFounder && <Badge variant="secondary" className="ml-2 text-[9px] py-0">Founder</Badge>}
                </td>
                <td className="px-2 py-2.5 text-center text-muted-foreground">{a.songCount}</td>
                <td className="px-2 py-2.5 text-center text-muted-foreground">{a.guestCount ?? 0}</td>
                <td className="px-4 py-2.5 text-right font-medium text-success">{formatCurrency(a.earnings)}</td>
              </tr>
            ))}
            {cancelled.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0 opacity-50">
                <td className="px-4 py-2.5">
                  <span className="line-through text-muted-foreground">{a.memberName}</span>
                  <Badge variant="outline" className="ml-2 text-[9px] py-0">
                    {a.refundIssued ? 'Refunded' : 'No Refund'}
                  </Badge>
                </td>
                <td className="px-2 py-2.5 text-center text-muted-foreground line-through">{a.songCount}</td>
                <td className="px-2 py-2.5 text-center text-muted-foreground line-through">{a.guestCount ?? 0}</td>
                <td className="px-4 py-2.5 text-right line-through text-muted-foreground">{formatCurrency(a.earnings)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
