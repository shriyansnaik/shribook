// ─── Earnings calculation spine ──────────────────────────────────────────────
// The single source of truth for how much an attendee contributes to an event.
// Rule: a founder's own songs are free (₹0), but any guests they bring are still
// charged. Guests apply to every event type; event type is a label only.

export interface RowEarningsInput {
  isFounder: boolean
  songCount: number
  guestCount: number
  ratePerSong: number
  guestFee: number
}

export function computeRowEarnings({
  isFounder,
  songCount,
  guestCount,
  ratePerSong,
  guestFee,
}: RowEarningsInput): number {
  const songPortion = isFounder ? 0 : songCount * ratePerSong
  const guestPortion = guestCount * guestFee
  return songPortion + guestPortion
}

// Net for an event = attendee revenue + sponsor income − expenses (+ any group
// opening balance is applied at the dashboard level, not per-event).
export function computeNetAmount(totalRevenue: number, totalSponsors: number, totalExpenses: number): number {
  return totalRevenue + totalSponsors - totalExpenses
}
