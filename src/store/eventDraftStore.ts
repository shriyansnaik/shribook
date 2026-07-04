import { create } from 'zustand'
import type { EventType } from '@/types'

export interface DraftAttendee {
  memberId: string
  memberName: string
  isFounder: boolean
  songCount: number
  guestCount: number
}

export interface DraftExpense {
  localId: string
  vendor: string
  amount: number
}

export interface DraftSponsor {
  localId: string
  name: string
  amount: number
}

export interface Step1Data {
  title: string
  date: string
  venue: string
  description?: string
  eventType: EventType
  ratePerSong: number
  guestFee: number
}

export interface DraftPayload {
  step1: Step1Data
  attendance: DraftAttendee[]
  expenses: DraftExpense[]
  sponsors: DraftSponsor[]
}

export type WizardStep = 1 | 2 | 3 | 4

interface EventDraftState {
  draftId: string | null
  currentStep: WizardStep
  step1: Step1Data | null
  attendance: DraftAttendee[]
  expenses: DraftExpense[]
  sponsors: DraftSponsor[]
  setStep1: (data: Step1Data) => void
  setStep: (step: WizardStep) => void
  toggleAttendee: (memberId: string, memberName: string, isFounder: boolean) => void
  updateSongCount: (memberId: string, count: number) => void
  updateGuestCount: (memberId: string, count: number) => void
  setExpenses: (expenses: DraftExpense[]) => void
  setSponsors: (sponsors: DraftSponsor[]) => void
  loadDraft: (draftId: string, payload: DraftPayload) => void
  reset: () => void
}

export const useEventDraftStore = create<EventDraftState>((set, get) => ({
  draftId: null,
  currentStep: 1,
  step1: null,
  attendance: [],
  expenses: [],
  sponsors: [],

  setStep1: (data) => set({ step1: data }),
  setStep: (currentStep) => set({ currentStep }),

  toggleAttendee: (memberId, memberName, isFounder) => {
    const { attendance } = get()
    const exists = attendance.find((a) => a.memberId === memberId)
    set({
      attendance: exists
        ? attendance.filter((a) => a.memberId !== memberId)
        : [...attendance, { memberId, memberName, isFounder, songCount: 1, guestCount: 0 }],
    })
  },

  updateSongCount: (memberId, count) => {
    set({
      attendance: get().attendance.map((a) =>
        a.memberId === memberId ? { ...a, songCount: Math.max(0, count) } : a
      ),
    })
  },

  updateGuestCount: (memberId, count) => {
    set({
      attendance: get().attendance.map((a) =>
        a.memberId === memberId ? { ...a, guestCount: Math.max(0, count) } : a
      ),
    })
  },

  setExpenses: (expenses) => set({ expenses }),
  setSponsors: (sponsors) => set({ sponsors }),

  loadDraft: (draftId, payload) => set({
    draftId,
    currentStep: 2,
    step1: payload.step1,
    attendance: payload.attendance,
    expenses: payload.expenses,
    sponsors: payload.sponsors,
  }),

  reset: () => set({ draftId: null, currentStep: 1, step1: null, attendance: [], expenses: [], sponsors: [] }),
}))
