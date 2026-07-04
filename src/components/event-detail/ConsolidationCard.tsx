import { Card, CardContent } from '@/components/ui/card'
import CurrencyDisplay from '@/components/shared/CurrencyDisplay'
import { formatCurrency } from '@/lib/utils'

interface Props {
  totalRevenue: number
  totalSponsors: number
  totalExpenses: number
  netAmount: number
}

export default function ConsolidationCard({ totalRevenue, totalSponsors, totalExpenses, netAmount }: Props) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Financial Summary
        </p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Singer revenue</span>
            <span className="font-medium text-success tabular-nums">{formatCurrency(totalRevenue)}</span>
          </div>
          {totalSponsors > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sponsors</span>
              <span className="font-medium text-success tabular-nums">{formatCurrency(totalSponsors)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expenses</span>
            <span className="font-medium text-danger tabular-nums">{formatCurrency(totalExpenses)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2 mt-1">
            <span className="font-semibold">Net</span>
            <CurrencyDisplay amount={netAmount} showSign size="lg" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
