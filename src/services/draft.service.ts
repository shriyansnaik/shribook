import {
  collection, doc, setDoc, updateDoc, deleteDoc, getDoc, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { computeRowEarnings, computeNetAmount } from '@/lib/earnings'
import type { DraftPayload } from '@/store/eventDraftStore'

function computeTotals(payload: DraftPayload) {
  const { step1, attendance, expenses, sponsors } = payload
  const totalRevenue = attendance.reduce((s, a) => s + computeRowEarnings({
    isFounder: a.isFounder,
    songCount: a.songCount,
    guestCount: a.guestCount,
    ratePerSong: step1.ratePerSong,
    subsequentSongRate: step1.subsequentSongRate,
    guestFee: step1.guestFee,
    earningsOverride: a.earningsOverride,
  }), 0)
  const totalSponsors = sponsors.reduce((s, sp) => s + Number(sp.amount || 0), 0)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  return {
    totalRevenue,
    totalSponsors,
    totalExpenses,
    netAmount: computeNetAmount(totalRevenue, totalSponsors, totalExpenses),
  }
}

// Persist the wizard as a status:'draft' event. The full wizard payload is
// embedded under `draft` so it can be re-hydrated on resume; standard total
// fields are also written so the events-list card renders normally.
export async function saveDraft(
  groupId: string,
  draftId: string | null,
  payload: DraftPayload,
  actorUid: string,
): Promise<string> {
  const { step1 } = payload
  const totals = computeTotals(payload)
  const cleanPayload = {
    ...payload,
    step1: {
      ...step1,
      description: step1.description ?? '',
      // Older drafts predate tiered pricing → fall back to flat.
      subsequentSongRate: step1.subsequentSongRate ?? step1.ratePerSong,
    },
    // Firestore rejects `undefined` in nested objects, so normalize the override.
    attendance: payload.attendance.map((a) => ({ ...a, earningsOverride: a.earningsOverride ?? null })),
  }

  const base = {
    title: step1.title,
    date: Timestamp.fromDate(new Date(step1.date)),
    venue: step1.venue,
    description: step1.description || null,
    eventType: step1.eventType,
    ratePerSong: step1.ratePerSong,
    subsequentSongRate: step1.subsequentSongRate ?? step1.ratePerSong,
    guestFee: step1.guestFee,
    status: 'draft' as const,
    attendingCount: payload.attendance.length,
    ...totals,
    draft: cleanPayload,
  }

  if (draftId) {
    await updateDoc(doc(db, 'groups', groupId, 'events', draftId), { ...base, lastSavedAt: serverTimestamp() })
    return draftId
  }

  const ref = doc(collection(db, 'groups', groupId, 'events'))
  await setDoc(ref, {
    ...base,
    createdAt: serverTimestamp(),
    createdBy: actorUid,
    lockedAt: null,
    approvers: [],
    approverNames: [],
    lastSavedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getDraft(groupId: string, draftId: string): Promise<DraftPayload | null> {
  const snap = await getDoc(doc(db, 'groups', groupId, 'events', draftId))
  if (!snap.exists()) return null
  const data = snap.data()
  return (data.draft as DraftPayload) ?? null
}

export async function deleteDraft(groupId: string, draftId: string) {
  await deleteDoc(doc(db, 'groups', groupId, 'events', draftId))
}
