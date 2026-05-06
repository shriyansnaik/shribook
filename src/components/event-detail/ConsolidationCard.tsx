import { Card, CardContent } from '@/components/ui/card'
import CurrencyDisplay from '@/components/shared/CurrencyDisplay'
import { formatCurrency } from '@/lib/utils'

interface Props {
  totalRevenue: number
  totalExpenses: number
  netAmount: number
}

export default function ConsolidationCard({ totalRevenue, totalExpenses, netAmount }: Props) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Financial Summary
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Revenue</p>
            <p className="font-bold text-success text-base">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Expenses</p>
            <p className="font-bold text-danger text-base">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="text-center border-l border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Net</p>
            <CurrencyDisplay amount={netAmount} showSign size="lg" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
