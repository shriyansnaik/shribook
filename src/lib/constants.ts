export const SUPER_ADMIN_EMAIL = 'shriyans.naik@gmail.com'

export const ROUTES = {
  LOGIN: '/login',
  GROUPS: '/groups',
  SUPER_ADMIN: '/super-admin',
  GROUP_DASHBOARD: (gid: string) => `/groups/${gid}/dashboard`,
  GROUP_EVENTS: (gid: string) => `/groups/${gid}/events`,
  GROUP_MEMBERS: (gid: string) => `/groups/${gid}/members`,
  GROUP_SETTINGS: (gid: string) => `/groups/${gid}/settings`,
  EVENT_CREATE: (gid: string) => `/groups/${gid}/events/new`,
  EVENT_DETAIL: (gid: string, eid: string) => `/groups/${gid}/events/${eid}`,
  EVENT_EDIT: (gid: string, eid: string) => `/groups/${gid}/events/${eid}/edit`,
} as const

export const EVENT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  LOCKED: 'locked',
  PENDING_APPROVAL: 'pending_approval',
} as const

export const EXPENSE_CATEGORIES = [
  { value: 'venue', label: 'Venue' },
  { value: 'musician', label: 'Musician / Sound' },
  { value: 'food', label: 'Food & Beverages' },
  { value: 'other', label: 'Other' },
] as const

// When a group has more than 1 admin, this many approvals are required for locked edits
export const MIN_APPROVALS_REQUIRED = 2

export const ACTIVITY_ACTIONS = {
  EVENT_CREATED: 'EVENT_CREATED',
  EVENT_UPDATED: 'EVENT_UPDATED',
  EVENT_LOCKED: 'EVENT_LOCKED',
  MEMBER_ADDED: 'MEMBER_ADDED',
  MEMBER_REMOVED: 'MEMBER_REMOVED',
  ATTENDANCE_ADDED: 'ATTENDANCE_ADDED',
  ATTENDANCE_CANCELLED: 'ATTENDANCE_CANCELLED',
  EXPENSE_ADDED: 'EXPENSE_ADDED',
  EXPENSE_UPDATED: 'EXPENSE_UPDATED',
  EXPENSE_DELETED: 'EXPENSE_DELETED',
  APPROVAL_REQUESTED: 'APPROVAL_REQUESTED',
  APPROVAL_CAST: 'APPROVAL_CAST',
  APPROVAL_RESOLVED: 'APPROVAL_RESOLVED',
} as const
