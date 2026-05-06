import {
  collection, doc, writeBatch, updateDoc, getDocs, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { ACTIVITY_ACTIONS } from '@/lib/constants'
import { buildLogEntry } from './activityLog.service'
import type { DraftAttendee, DraftExpense } from '@/store/eventDraftStore'

// ─── helpers ────────────────────────────────────────────────────────────────

async function recalcTotals(groupId: string, eventId: string) {
  const [attSnap, expSnap] = await Promise.all([
    getDocs(collection(db, 'groups', groupId, 'events', eventId, 'attendance')),
    getDocs(collection(db, 'groups', groupId, 'events', eventId, 'expenses')),
  ])
  const attending = attSnap.docs.filter((d) => d.data().status === 'attending')
  const totalRevenue = attending.reduce((s, d) => s + (d.data().earnings as number), 0)
  const totalExpenses = expSnap.docs.reduce((s, d) => s + (d.data().amount as number), 0)
  await updateDoc(doc(db, 'groups', groupId, 'events', eventId), {
    totalRevenue,
    totalExpenses,
    netAmount: totalRevenue - totalExpenses,
    attendingCount: attending.length,
  })
}

function lockDate(eventDate: Date): Date {
  return new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate() + 1)
}

// ─── create ─────────────────────────────────────────────────────────────────

export async function createEvent(
  groupId: string,
  step1: { title: string; date: string; venue: string; description?: string; ratePerSong: number },
  attendance: DraftAttendee[],
  expenses: DraftExpense[],
  actorUid: string,
  actorName: string
): Promise<string> {
  const batch = writeBatch(db)

  const eventDate = new Date(step1.date)
  const totalRevenue = attendance.reduce((s, a) => s + a.songCount * step1.ratePerSong, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

  const eventRef = doc(collection(db, 'groups', groupId, 'events'))

  batch.set(eventRef, {
    title: step1.title,
    date: Timestamp.fromDate(eventDate),
    venue: step1.venue,
    description: step1.description || null,
    ratePerSong: step1.ratePerSong,
    status: 'active',
    createdAt: serverTimestamp(),
    createdBy: actorUid,
    lockedAt: Timestamp.fromDate(lockDate(eventDate)),
    approvers: [],
    approverNames: [],
    totalRevenue,
    totalExpenses,
    netAmount: totalRevenue - totalExpenses,
    attendingCount: attendance.length,
  })

  for (const a of attendance) {
    const ref = doc(collection(db, 'groups', groupId, 'events', eventRef.id, 'attendance'))
    batch.set(ref, {
      memberId: a.memberId,
      memberName: a.memberName,
      songCount: a.songCount,
      earnings: a.songCount * step1.ratePerSong,
      status: 'attending',
      cancelledAt: null,
      refundIssued: false,
      addedAt: serverTimestamp(),
      addedBy: actorUid,
      lastModifiedAt: serverTimestamp(),
      lastModifiedBy: actorUid,
    })
  }

  for (const e of expenses) {
    const ref = doc(collection(db, 'groups', groupId, 'events', eventRef.id, 'expenses'))
    batch.set(ref, {
      vendor: e.vendor,
      category: e.category,
      amount: e.amount,
      notes: e.notes || null,
      addedAt: serverTimestamp(),
      addedBy: actorUid,
      lastModifiedAt: null,
      lastModifiedBy: null,
    })
  }

  const logRef = doc(collection(db, 'groups', groupId, 'events', eventRef.id, 'activityLog'))
  batch.set(logRef, buildLogEntry(actorUid, actorName, ACTIVITY_ACTIONS.EVENT_CREATED, `Event "${step1.title}" was created`))

  await batch.commit()
  return eventRef.id
}

// ─── lock ────────────────────────────────────────────────────────────────────

export async function checkAndLockIfNeeded(groupId: string, eventId: string, lockedAt: Timestamp | null, status: string) {
  if (status !== 'active' || !lockedAt) return
  if (new Date() >= lockedAt.toDate()) {
    await updateDoc(doc(db, 'groups', groupId, 'events', eventId), { status: 'locked' })
  }
}

// ─── approve event ───────────────────────────────────────────────────────────

export async function approveEvent(
  groupId: string,
  eventId: string,
  actorUid: string,
  actorName: string
) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'groups', groupId, 'events', eventId), {
    approvers: (await import('firebase/firestore')).arrayUnion(actorUid),
    approverNames: (await import('firebase/firestore')).arrayUnion(actorName),
  })
  const logRef = doc(collection(db, 'groups', groupId, 'events', eventId, 'activityLog'))
  batch.set(logRef, buildLogEntry(actorUid, actorName, ACTIVITY_ACTIONS.EVENT_UPDATED, `${actorName} reviewed and approved this event`))
  await batch.commit()
}

// ─── attendance ──────────────────────────────────────────────────────────────

export async function cancelAttendance(
  groupId: string,
  eventId: string,
  attendanceId: string,
  refundIssued: boolean,
  actorUid: string,
  actorName: string
) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'groups', groupId, 'events', eventId, 'attendance', attendanceId), {
    status: 'cancelled',
    cancelledAt: serverTimestamp(),
    refundIssued,
    lastModifiedAt: serverTimestamp(),
    lastModifiedBy: actorUid,
  })
  const logRef = doc(collection(db, 'groups', groupId, 'events', eventId, 'activityLog'))
  const label = refundIssued ? 'with refund' : 'without refund'
  batch.set(logRef, buildLogEntry(actorUid, actorName, ACTIVITY_ACTIONS.ATTENDANCE_CANCELLED, `Singer cancelled (${label})`))
  await batch.commit()
  await recalcTotals(groupId, eventId)
}

export async function addAttendee(
  groupId: string,
  eventId: string,
  ratePerSong: number,
  attendee: { memberId: string; memberName: string; songCount: number },
  actorUid: string,
  actorName: string
) {
  const batch = writeBatch(db)
  const ref = doc(collection(db, 'groups', groupId, 'events', eventId, 'attendance'))
  batch.set(ref, {
    memberId: attendee.memberId,
    memberName: attendee.memberName,
    songCount: attendee.songCount,
    earnings: attendee.songCount * ratePerSong,
    status: 'attending',
    cancelledAt: null,
    refundIssued: false,
    addedAt: serverTimestamp(),
    addedBy: actorUid,
    lastModifiedAt: serverTimestamp(),
    lastModifiedBy: actorUid,
  })
  const logRef = doc(collection(db, 'groups', groupId, 'events', eventId, 'activityLog'))
  batch.set(logRef, buildLogEntry(actorUid, actorName, ACTIVITY_ACTIONS.ATTENDANCE_ADDED, `${attendee.memberName} added as singer (${attendee.songCount} song${attendee.songCount > 1 ? 's' : ''})`))
  await batch.commit()
  await recalcTotals(groupId, eventId)
}

// ─── expenses ────────────────────────────────────────────────────────────────

export async function addExpense(
  groupId: string,
  eventId: string,
  data: { vendor: string; category: string; amount: number; notes?: string },
  actorUid: string,
  actorName: string
) {
  const batch = writeBatch(db)
  const ref = doc(collection(db, 'groups', groupId, 'events', eventId, 'expenses'))
  batch.set(ref, {
    vendor: data.vendor,
    category: data.category,
    amount: data.amount,
    notes: data.notes || null,
    addedAt: serverTimestamp(),
    addedBy: actorUid,
    lastModifiedAt: null,
    lastModifiedBy: null,
  })
  const logRef = doc(collection(db, 'groups', groupId, 'events', eventId, 'activityLog'))
  batch.set(logRef, buildLogEntry(actorUid, actorName, ACTIVITY_ACTIONS.EXPENSE_ADDED, `Expense added: ${data.vendor} (₹${data.amount})`))
  await batch.commit()
  await recalcTotals(groupId, eventId)
}

export async function updateExpense(
  groupId: string,
  eventId: string,
  expenseId: string,
  data: { vendor?: string; amount?: number; notes?: string | null },
  actorUid: string,
  actorName: string
) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'groups', groupId, 'events', eventId, 'expenses', expenseId), {
    ...data,
    lastModifiedAt: serverTimestamp(),
    lastModifiedBy: actorUid,
  })
  const logRef = doc(collection(db, 'groups', groupId, 'events', eventId, 'activityLog'))
  batch.set(logRef, buildLogEntry(actorUid, actorName, ACTIVITY_ACTIONS.EXPENSE_UPDATED, `Expense updated: ${data.vendor ?? ''}`))
  await batch.commit()
  await recalcTotals(groupId, eventId)
}

export async function deleteExpense(
  groupId: string,
  eventId: string,
  expenseId: string,
  actorUid: string,
  actorName: string
) {
  const { deleteDoc } = await import('firebase/firestore')
  const batch = writeBatch(db)
  batch.delete(doc(db, 'groups', groupId, 'events', eventId, 'expenses', expenseId))
  const logRef = doc(collection(db, 'groups', groupId, 'events', eventId, 'activityLog'))
  batch.set(logRef, buildLogEntry(actorUid, actorName, ACTIVITY_ACTIONS.EXPENSE_DELETED, 'Expense removed'))
  await batch.commit()
  await recalcTotals(groupId, eventId)
  void deleteDoc // suppress unused import warning
}
