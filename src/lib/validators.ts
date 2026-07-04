import { z } from 'zod'

export const groupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100),
  openingBalance: z.coerce.number().min(0, 'Cannot be negative').max(1000000000),
})

export const memberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().max(15).optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
})

export const eventStep1Schema = z.object({
  title: z.string().min(1, 'Event name is required').max(100),
  date: z.string().min(1, 'Date is required'),
  venue: z.string().min(1, 'Venue is required').max(200),
  description: z.string().max(500).optional().or(z.literal('')),
  ratePerSong: z.coerce.number().min(1, 'Rate must be at least ₹1').max(100000),
  guestFee: z.coerce.number().min(0, 'Cannot be negative').max(100000),
})

export const expenseRowSchema = z.object({
  vendor: z.string().min(1, 'Expense name is required'),
  amount: z.coerce.number().min(1, 'Amount must be at least ₹1'),
})

export type GroupFormValues = z.infer<typeof groupSchema>
export type MemberFormValues = z.infer<typeof memberSchema>
export type EventStep1Values = z.infer<typeof eventStep1Schema>
export type ExpenseRowValues = z.infer<typeof expenseRowSchema>
