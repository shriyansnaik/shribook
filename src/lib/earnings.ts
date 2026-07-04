// ─── Earnings calculation spine ──────────────────────────────────────────────
// The single source of truth for how much an attendee contributes to an event.
// Rules:
//  • A founder's own songs are free (₹0), but any guests they bring are still
//    charged. Guests apply to every event type; event type is a label only.
//  • Song pricing can be tiered: the first song is charged at `ratePerSong` and
//    every song after that at `subsequentSongRate`. When `subsequentSongRate` is
//    omitted it falls back to `ratePerSong` (flat pricing — the classic case).
//  • `earningsOverride`, when provided, replaces the whole computed amount. It is
//    a manual figure an admin typed for a singer and wins over every rule above.

export interface RowEarningsInput {
  isFounder: boolean
  songCount: number
  guestCount: number
  ratePerSong: number
  guestFee: number
  subsequentSongRate?: number
  earningsOverride?: number | null
}

export function computeRowEarnings({
  isFounder,
  songCount,
  guestCount,
  ratePerSong,
  guestFee,
  subsequentSongRate,
  earningsOverride,
}: RowEarningsInput): number {
  if (earningsOverride != null) return earningsOverride

  const subsequent = subsequentSongRate ?? ratePerSong
  let songPortion = 0
  if (!isFounder && songCount > 0) {
    songPortion = ratePerSong + Math.max(0, songCount - 1) * subsequent
  }
  const guestPortion = guestCount * guestFee
  return songPortion + guestPortion
}

// Net for an event = attendee revenue + sponsor income − expenses (+ any group
// opening balance is applied at the dashboard level, not per-event).
export function computeNetAmount(totalRevenue: number, totalSponsors: number, totalExpenses: number): number {
  return totalRevenue + totalSponsors - totalExpenses
}
