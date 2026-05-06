import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Timestamp } from 'firebase/firestore'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | Timestamp | null, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '—'
  const d = date instanceof Timestamp ? date.toDate() : date
  return d.toLocaleDateString('en-IN', options ?? { day: 'numeric', month: 'short', year: 'numeric' })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function isCalendarDayAfter(eventDate: Date | Timestamp, targetDate: Date = new Date()): boolean {
  const d = eventDate instanceof Timestamp ? eventDate.toDate() : eventDate
  const eventMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const targetMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
  return targetMidnight > eventMidnight
}
