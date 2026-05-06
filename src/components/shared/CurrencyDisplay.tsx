import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'

interface CurrencyDisplayProps {
  amount: number
  className?: string
  showSign?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function CurrencyDisplay({ amount, className, showSign, size = 'md' }: CurrencyDisplayProps) {
  const isPositive = amount >= 0
  const isNegative = amount < 0

  return (
    <span
      className={cn(
        'font-semibold tabular-nums',
        size === 'sm' && 'text-sm',
        size === 'md' && 'text-base',
        size === 'lg' && 'text-2xl font-bold',
        showSign && isPositive && 'text-success',
        showSign && isNegative && 'text-danger',
        className
      )}
    >
      {showSign && isPositive && '+'}
      {formatCurrency(amount)}
    </span>
  )
}
