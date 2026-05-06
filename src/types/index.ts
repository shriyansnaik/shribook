import { Timestamp } from 'firebase/firestore'

export type UserRole = 'admin' | 'member'
export type EventStatus = 'draft' | 'active' | 'locked' | 'pending_approval'
export type AttendanceStatus = 'attending' | 'cancelled'
export type ExpenseCategory = 'venue' | 'musician' | 'food' | 'other'
export type ChangeType = 'cancel_singer' | 'add_singer' | 'edit_expense' | 'delete_expense'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type VoteChoice = 'approve' | 'reject'

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

export interface Group {
  id: string
  name: string
  defaultRatePerSong: number
  createdAt: Timestamp
  createdBy: string
  admins: string[]
  members: string[]
  memberCount: number
}

export interface Member {
  id: string
  name: string
  phone: string | null
  email: string | null
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
  ratePerSong: number
  status: EventStatus
  createdAt: Timestamp
  createdBy: string
  lockedAt: Timestamp | null
  approvers: string[]
  approverNames: string[]
  totalRevenue: number
  totalExpenses: number
  netAmount: number
  attendingCount: number
}

export interface Attendance {
  id: string
  memberId: string
  memberName: string
  songCount: number
  earnings: number
  status: AttendanceStatus
  cancelledAt: Timestamp | null
  refundIssued: boolean
  addedAt: Timestamp
  addedBy: string
  lastModifiedAt: Timestamp
  lastModifiedBy: string
}

export interface Expense {
  id: string
  vendor: string
  category: ExpenseCategory
  amount: number
  notes: string | null
  addedAt: Timestamp
  addedBy: string
  lastModifiedAt: Timestamp | null
  lastModifiedBy: string | null
}

export interface ApprovalVote {
  vote: VoteChoice
  votedAt: Timestamp
  voterName: string
}

export interface Approval {
  id: string
  requestedAt: Timestamp
  requestedBy: string
  changeDescription: string
  changeType: ChangeType
  changePayload: Record<string, unknown>
  status: ApprovalStatus
  votes: Record<string, ApprovalVote>
  resolvedAt: Timestamp | null
  resolvedBy: string | null
  requiredApprovals: number
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
