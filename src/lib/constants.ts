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
} as const

export const ACTIVITY_ACTIONS = {
  EVENT_CREATED: 'EVENT_CREATED',
  EVENT_UPDATED: 'EVENT_UPDATED',
  EVENT_LOCKED: 'EVENT_LOCKED',
  EVENT_APPROVED: 'EVENT_APPROVED',
  MEMBER_ADDED: 'MEMBER_ADDED',
  MEMBER_REMOVED: 'MEMBER_REMOVED',
  ATTENDANCE_ADDED: 'ATTENDANCE_ADDED',
  ATTENDANCE_CANCELLED: 'ATTENDANCE_CANCELLED',
  ATTENDANCE_UPDATED: 'ATTENDANCE_UPDATED',
  EXPENSE_ADDED: 'EXPENSE_ADDED',
  EXPENSE_UPDATED: 'EXPENSE_UPDATED',
  EXPENSE_DELETED: 'EXPENSE_DELETED',
} as const
