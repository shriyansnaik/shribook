import { Timestamp } from 'firebase/firestore'

export type UserRole = 'admin' | 'member'
export type MemberRole = 'member' | 'founder'
export type EventType = 'regular' | 'special'
export type EventStatus = 'draft' | 'active' | 'locked'
export type AttendanceStatus = 'attending' | 'cancelled'

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

export interface Group {
  id: string
  name: string
  openingBalance: number
  createdAt: Timestamp
  createdBy: string
  admins: string[]
  members: string[]
  memberCount: number
  // Lowercased emails of members / approvers, mirrored onto the group doc so
  // feed discovery and security rules can match a signed-in user by email.
  memberEmails: string[]
  approverEmails: string[]
}

export interface Member {
  id: string
  name: string
  phone: string | null
  email: string | null
  role: MemberRole
  isApprover: boolean
  addedAt: Timestamp
  addedBy: string
  isActive: boolean
  linkedUid: string | null
}

export interface Event {
  id: string
  title: string
  date: Timestamp
  venue: string
  description: string | null
  eventType: EventType
  ratePerSong: number
  // Rate charged for the 2nd song onward. Absent on older events → equals
  // ratePerSong (flat pricing).
  subsequentSongRate?: number
  guestFee: number
  status: EventStatus
  createdAt: Timestamp
  createdBy: string
  lockedAt: Timestamp | null
  approvers: string[]
  approverNames: string[]
  totalRevenue: number
  totalSponsors: number
  totalExpenses: number
  netAmount: number
  attendingCount: number
}

export interface Attendance {
  id: string
  memberId: string
  memberName: string
  isFounder: boolean
  songCount: number
  guestCount: number
  earnings: number
  // Manual amount typed by an admin. When set, it overrides the computed
  // earnings and is preserved across rate changes. null → auto-calculated.
  earningsOverride?: number | null
  status: AttendanceStatus
  cancelledAt: Timestamp | null
  refundIssued: boolean
  addedAt: Timestamp
  addedBy: string
  lastModifiedAt: Timestamp
  lastModifiedBy: string
}

export interface Sponsor {
  id: string
  name: string
  amount: number
  addedAt: Timestamp
  addedBy: string
  lastModifiedAt: Timestamp | null
  lastModifiedBy: string | null
}

export interface Expense {
  id: string
  vendor: string
  amount: number
  notes: string | null
  addedAt: Timestamp
  addedBy: string
  lastModifiedAt: Timestamp | null
  lastModifiedBy: string | null
}

export interface ActivityLogEntry {
  id: string
  timestamp: Timestamp
  actorUid: string
  actorName: string
  action: string
  description: string
  metadata: Record<string, unknown> | null
}
