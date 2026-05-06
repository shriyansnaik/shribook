import { create } from 'zustand'
import type { Group, Member, UserRole } from '@/types'

interface GroupState {
  activeGroup: Group | null
  userRole: UserRole | null
  members: Member[]
  setGroup: (group: Group | null) => void
  setUserRole: (role: UserRole | null) => void
  setMembers: (members: Member[]) => void
  clearGroup: () => void
}

export const useGroupStore = create<GroupState>((set) => ({
  activeGroup: null,
  userRole: null,
  members: [],
  setGroup: (group) => set({ activeGroup: group }),
  setUserRole: (role) => set({ userRole: role }),
  setMembers: (members) => set({ members }),
  clearGroup: () => set({ activeGroup: null, userRole: null, members: [] }),
}))
