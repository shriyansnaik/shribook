import { create } from 'zustand'

export interface DraftAttendee {
  memberId: string
  memberName: string
  songCount: number
}

export interface DraftExpense {
  localId: string
  vendor: string
  category: string
  amount: number
  notes: string
}

export interface Step1Data {
  title: string
  date: string
  venue: string
  description?: string
  ratePerSong: number
}

interface EventDraftState {
  currentStep: 1 | 2 | 3
  step1: Step1Data | null
  attendance: DraftAttendee[]
  expenses: DraftExpense[]
  setStep1: (data: Step1Data) => void
  setStep: (step: 1 | 2 | 3) => void
  toggleAttendee: (memberId: string, memberName: string) => void
  updateSongCount: (memberId: string, count: number) => void
  setExpenses: (expenses: DraftExpense[]) => void
  reset: () => void
}

export const useEventDraftStore = create<EventDraftState>((set, get) => ({
  currentStep: 1,
  step1: null,
  attendance: [],
  expenses: [],

  setStep1: (data) => set({ step1: data }),
  setStep: (currentStep) => set({ currentStep }),

  toggleAttendee: (memberId, memberName) => {
    const { attendance } = get()
    const exists = attendance.find((a) => a.memberId === memberId)
    set({
      attendance: exists
        ? attendance.filter((a) => a.memberId !== memberId)
        : [...attendance, { memberId, memberName, songCount: 1 }],
    })
  },

  updateSongCount: (memberId, count) => {
    set({
      attendance: get().attendance.map((a) =>
        a.memberId === memberId ? { ...a, songCount: Math.max(1, count) } : a
      ),
    })
  },

  setExpenses: (expenses) => set({ expenses }),

  reset: () => set({ currentStep: 1, step1: null, attendance: [], expenses: [] }),
}))
