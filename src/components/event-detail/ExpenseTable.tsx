import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import type { Expense } from '@/types'

function categoryLabel(value: string) {
  return EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value
}

export default function ExpenseTable({ expenses }: { expenses: Expense[] }) {
  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Expenses ({expenses.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Vendor</th>
              <th className="text-left px-2 py-2 text-xs text-muted-foreground font-medium hidden sm:table-cell">Category</th>
              <th className="text-right px-4 py-2 text-xs text-muted-foreground font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5">
                  <p className="font-medium">{e.vendor}</p>
                  {e.notes && <p className="text-xs text-muted-foreground">{e.notes}</p>}
                </td>
                <td className="px-2 py-2.5 hidden sm:table-cell">
                  <Badge variant="secondary" className="text-[10px]">{categoryLabel(e.category)}</Badge>
                </td>
                <td className="px-4 py-2.5 text-right font-medium text-danger">{formatCurrency(e.amount)}</td>
              </tr>
            ))}
            <tr className="bg-muted/30">
              <td className="px-4 py-2 font-semibold text-xs uppercase tracking-wide text-muted-foreground" colSpan={2}>Total</td>
              <td className="px-4 py-2 text-right font-bold text-danger">{formatCurrency(total)}</td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
