import {
  collection, doc, writeBatch, updateDoc, getDocs, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { ACTIVITY_ACTIONS } from '@/lib/constants'
import { computeRowEarnings, computeNetAmount } from '@/lib/earnings'
import { buildLogEntry, logActivity } from './activityLog.service'
import type { DraftAttendee, DraftExpense, DraftSponsor, Step1Data } from '@/store/eventDraftStore'

// ─── helpers ────────────────────────────────────────────────────────────────

async function recalcTotals(groupId: string, eventId: string) {
  const [attSnap, expSnap, spSnap] = await Promise.all([
    getDocs(collection(db, 'groups', groupId, 'events', eventId, 'attendance')),
    getDocs(collection(db, 'groups', groupId, 'events', eventId, 'expenses')),
    getDocs(collection(db, 'groups', groupId, 'events', eventId, 'sponsors')),
  ])
  const attending = attSnap.docs.filter((d) => d.data().status === 'attending')
  const totalRevenue = attending.reduce((s, d) => s + (d.data().earnings as number), 0)
  const totalExpenses = expSnap.docs.reduce((s, d) => s + (d.data().amount as number), 0)
  const totalSponsors = spSnap.docs.reduce((s, d) => s + (d.data().amount as number), 0)
  await updateDoc(doc(db, 'groups', groupId, 'events', eventId), {
    totalRevenue,
    totalSponsors,
    totalExpenses,
    netAmount: computeNetAmount(totalRevenue, totalSponsors, totalExpenses),
    attendingCount: attending.length,
  })
}

function lockDate(eventDate: Date): Date {
  return new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate() + 1)
}

// ─── create ─────────────────────────────────────────────────────────────────

export async function createEvent(
  groupId: string,
  step1: Step1Data,
  attendance: DraftAttendee[],
  expenses: DraftExpense[],
  sponsors: DraftSponsor[],
  actorUid: string,
  actorName: string
): Promise<string> {
  const batch = writeBatch(db)

  const eventDate = new Date(step1.date)
  const rowEarnings = (a: DraftAttendee) => computeRowEarnings({
    isFounder: a.isFounder,
    songCount: a.songCount,
    guestCount: a.guestCount,
    ratePerSong: step1.ratePerSong,
    guestFee: step1.guestFee,
  })
  const totalRevenue = attendance.reduce((s, a) => s + rowEarnings(a), 0)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalSponsors = sponsors.reduce((s, sp) => s + Number(sp.amount), 0)

  const eventRef = doc(collection(db, 'groups', groupId, 'events'))

  batch.set(eventRef, {
    title: step1.title,
    date: Timestamp.fromDate(eventDate),
    venue: step1.venue,
    description: step1.description || null,
    eventType: step1.eventType,
    ratePerSong: step1.ratePerSong,
    guestFee: step1.guestFee,
    status: 'active',
    createdAt: serverTimestamp(),
    createdBy: actorUid,
    lockedAt: Timestamp.fromDate(lockDate(eventDate)),
    approvers: [],
    approverNames: [],
    totalRevenue,
    totalSponsors,
    totalExpenses,
    netAmount: computeNetAmount(totalRevenue, totalSponsors, totalExpenses),
    attendingCount: attendance.length,
  })

  for (const a of attendance) {
    const ref = doc(collection(db, 'groups', groupId, 'events', eventRef.id, 'attendance'))
    batch.set(ref, {
      memberId: a.memberId,
      memberName: a.memberName,
      isFounder: a.isFounder,
      songCount: a.songCount,
      guestCount: a.guestCount,
      earnings: rowEarnings(a),
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
      amount: Number(e.amount),
      notes: null,
      addedAt: serverTimestamp(),
      addedBy: actorUid,
      lastModifiedAt: null,
      lastModifiedBy: null,
    })
  }

  for (const sp of sponsors) {
    const ref = doc(collection(db, 'groups', groupId, 'events', eventRef.id, 'sponsors'))
    batch.set(ref, {
      name: sp.name,
      amount: Number(sp.amount),
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
  batch.set(logRef, buildLogEntry(actorUid, actorName, ACTIVITY_ACTIONS.EVENT_APPROVED, `${actorName} reviewed and approved this event`))
  await batch.commit()
}

// ─── attendance ──────────────────────────────────────────────────────────────

export async function cancelAttendance(
  groupId: string,
  eventId: string,
  attendanceId: string,
  refundIssued: boolean,
  actorUid: string,
  actorName: string,
  memberName = 'Singer'
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
  batch.set(logRef, buildLogEntry(actorUid, actorName, ACTIVITY_ACTIONS.ATTENDANCE_CANCELLED, `${memberName} cancelled (${label})`))
  await batch.commit()
  await recalcTotals(groupId, eventId)
}

export async function addAttendee(
  groupId: string,
  eventId: string,
  event: { ratePerSong: number; guestFee: number },
  attendee: { memberId: string; memberName: string; isFounder: boolean; songCount: number; guestCount: number },
  actorUid: string,
  actorName: string
) {
  const earnings = computeRowEarnings({
    isFounder: attendee.isFounder,
    songCount: attendee.songCount,
    guestCount: attendee.guestCount,
    ratePerSong: event.ratePerSong,
    guestFee: event.guestFee,
  })
  const batch = writeBatch(db)
  const ref = doc(collection(db, 'groups', groupId, 'events', eventId, 'attendance'))
  batch.set(ref, {
    memberId: attendee.memberId,
    memberName: attendee.memberName,
    isFounder: attendee.isFounder,
    songCount: attendee.songCount,
    guestCount: attendee.guestCount,
    earnings,
    status: 'attending',
    cancelledAt: null,
    refundIssued: false,
    addedAt: serverTimestamp(),
    addedBy: actorUid,
    lastModifiedAt: serverTimestamp(),
    lastModifiedBy: actorUid,
  })
  const guestNote = attendee.guestCount > 0 ? `, ${attendee.guestCount} guest${attendee.guestCount > 1 ? 's' : ''}` : ''
  const logRef = doc(collection(db, 'groups', groupId, 'events', eventId, 'activityLog'))
  batch.set(logRef, buildLogEntry(actorUid, actorName, ACTIVITY_ACTIONS.ATTENDANCE_ADDED, `${attendee.memberName} added as singer (${attendee.songCount} song${attendee.songCount > 1 ? 's' : ''}${guestNote})`))
  await batch.commit()
  await recalcTotals(groupId, eventId)
}

export async function updateAttendee(
  groupId: string,
  eventId: string,
  attendanceId: string,
  event: { ratePerSong: number; guestFee: number },
  prev: { memberName: string; isFounder: boolean; songCount: number; guestCount: number },
  next: { songCount: number; guestCount: number },
  actorUid: string,
  actorName: string
) {
  const earnings = computeRowEarnings({
    isFounder: prev.isFounder,
    songCount: next.songCount,
    guestCount: next.guestCount,
    ratePerSong: event.ratePerSong,
    guestFee: event.guestFee,
  })
  const batch = writeBatch(db)
  batch.update(doc(db, 'groups', groupId, 'events', eventId, 'attendance', attendanceId), {
    songCount: next.songCount,
    guestCount: next.guestCount,
    earnings,
    lastModifiedAt: serverTimestamp(),
    lastModifiedBy: actorUid,
  })
  const parts: string[] = []
  if (next.songCount !== prev.songCount) parts.push(`songs ${prev.songCount} → ${next.songCount}`)
  if (next.guestCount !== prev.guestCount) parts.push(`guests ${prev.guestCount} → ${next.guestCount}`)
  const logRef = doc(collection(db, 'groups', groupId, 'events', eventId, 'activityLog'))
  batch.set(logRef, buildLogEntry(
    actorUid, actorName, ACTIVITY_ACTIONS.ATTENDANCE_UPDATED,
    `${prev.memberName} updated (${parts.join(', ') || 'no change'})`,
    { songCount: next.songCount, guestCount: next.guestCount, earnings },
  ))
  await batch.commit()
  await recalcTotals(groupId, eventId)
}

// ─── expenses ────────────────────────────────────────────────────────────────

export async function addExpense(
  groupId: string,
  eventId: string,
  data: { vendor: string; amount: number },
  actorUid: string,
  actorName: string
) {
  const batch = writeBatch(db)
  const ref = doc(collection(db, 'groups', groupId, 'events', eventId, 'expenses'))
  batch.set(ref, {
    vendor: data.vendor,
    amount: Number(data.amount),
    notes: null,
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
  actorName: string,
  prevAmount?: number
) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'groups', groupId, 'events', eventId, 'expenses', expenseId), {
    ...data,
    lastModifiedAt: serverTimestamp(),
    lastModifiedBy: actorUid,
  })
  const amountNote = (prevAmount !== undefined && data.amount !== undefined && prevAmount !== data.amount)
    ? ` (₹${prevAmount} → ₹${data.amount})`
    : ''
  const logRef = doc(collection(db, 'groups', groupId, 'events', eventId, 'activityLog'))
  batch.set(logRef, buildLogEntry(actorUid, actorName, ACTIVITY_ACTIONS.EXPENSE_UPDATED, `Expense "${data.vendor ?? ''}" updated${amountNote}`))
  await batch.commit()
  await recalcTotals(groupId, eventId)
}

export async function deleteExpense(
  groupId: string,
  eventId: string,
  expenseId: string,
  actorUid: string,
  actorName: string,
  info?: { vendor: string; amount: number }
) {
  const batch = writeBatch(db)
  batch.delete(doc(db, 'groups', groupId, 'events', eventId, 'expenses', expenseId))
  const desc = info ? `Expense "${info.vendor}" (₹${info.amount}) removed` : 'Expense removed'
  const logRef = doc(collection(db, 'groups', groupId, 'events', eventId, 'activityLog'))
  batch.set(logRef, buildLogEntry(actorUid, actorName, ACTIVITY_ACTIONS.EXPENSE_DELETED, desc))
  await batch.commit()
  await recalcTotals(groupId, eventId)
}

// ─── sponsors ────────────────────────────────────────────────────────────────

export async function addSponsor(
  groupId: string,
  eventId: string,
  data: { name: string; amount: number },
  actorUid: string,
  actorName: string
) {
  const batch = writeBatch(db)
  const ref = doc(collection(db, 'groups', groupId, 'events', eventId, 'sponsors'))
  batch.set(ref, {
    name: data.name,
    amount: Number(data.amount),
    addedAt: serverTimestamp(),
    addedBy: actorUid,
    lastModifiedAt: null,
    lastModifiedBy: null,
  })
  const logRef = doc(collection(db, 'groups', groupId, 'events', eventId, 'activityLog'))
  batch.set(logRef, buildLogEntry(actorUid, actorName, ACTIVITY_ACTIONS.EVENT_UPDATED, `Sponsor added: ${data.name} (₹${data.amount})`))
  await batch.commit()
  await recalcTotals(groupId, eventId)
}

export async function deleteSponsor(
  groupId: string,
  eventId: string,
  sponsorId: string,
  actorUid: string,
  actorName: string,
  info?: { name: string; amount: number }
) {
  const batch = writeBatch(db)
  batch.delete(doc(db, 'groups', groupId, 'events', eventId, 'sponsors', sponsorId))
  const desc = info ? `Sponsor "${info.name}" (₹${info.amount}) removed` : 'Sponsor removed'
  const logRef = doc(collection(db, 'groups', groupId, 'events', eventId, 'activityLog'))
  batch.set(logRef, buildLogEntry(actorUid, actorName, ACTIVITY_ACTIONS.EVENT_UPDATED, desc))
  await batch.commit()
  await recalcTotals(groupId, eventId)
}

// ─── edit event details ────────────────────────────────────────────────────────

export async function updateEventDetails(
  groupId: string,
  eventId: string,
  data: { title: string; date: string; venue: string; description?: string; eventType: 'regular' | 'special'; ratePerSong: number; guestFee: number },
  prev: { title: string; venue: string; eventType: 'regular' | 'special'; ratePerSong: number; guestFee: number },
  actorUid: string,
  actorName: string
) {
  const eventDate = new Date(data.date)
  await updateDoc(doc(db, 'groups', groupId, 'events', eventId), {
    title: data.title,
    date: Timestamp.fromDate(eventDate),
    venue: data.venue,
    description: data.description || null,
    eventType: data.eventType,
    ratePerSong: data.ratePerSong,
    guestFee: data.guestFee,
    lockedAt: Timestamp.fromDate(lockDate(eventDate)),
  })

  // If the per-song rate or guest fee changed, every attendee's earnings must
  // be recomputed from their stored song/guest counts (and founder status).
  if (data.ratePerSong !== prev.ratePerSong || data.guestFee !== prev.guestFee) {
    const attSnap = await getDocs(collection(db, 'groups', groupId, 'events', eventId, 'attendance'))
    const batch = writeBatch(db)
    attSnap.docs.forEach((d) => {
      const a = d.data()
      const earnings = computeRowEarnings({
        isFounder: !!a.isFounder,
        songCount: a.songCount ?? 0,
        guestCount: a.guestCount ?? 0,
        ratePerSong: data.ratePerSong,
        guestFee: data.guestFee,
      })
      batch.update(d.ref, { earnings })
    })
    await batch.commit()
  }

  const changes: string[] = []
  if (data.title !== prev.title) changes.push(`name "${prev.title}" → "${data.title}"`)
  if (data.venue !== prev.venue) changes.push('venue')
  if (data.eventType !== prev.eventType) changes.push(`type ${prev.eventType} → ${data.eventType}`)
  if (data.ratePerSong !== prev.ratePerSong) changes.push(`rate ₹${prev.ratePerSong} → ₹${data.ratePerSong}`)
  if (data.guestFee !== prev.guestFee) changes.push(`guest fee ₹${prev.guestFee} → ₹${data.guestFee}`)
  const desc = changes.length ? `Event details updated: ${changes.join(', ')}` : 'Event details updated'
  await logActivity(groupId, eventId, actorUid, actorName, ACTIVITY_ACTIONS.EVENT_UPDATED, desc)

  await recalcTotals(groupId, eventId)
}

// ─── delete event ──────────────────────────────────────────────────────────────

export async function deleteEvent(groupId: string, eventId: string) {
  const subcolls = ['attendance', 'expenses', 'sponsors', 'activityLog']
  for (const sub of subcolls) {
    const snap = await getDocs(collection(db, 'groups', groupId, 'events', eventId, sub))
    for (let i = 0; i < snap.docs.length; i += 400) {
      const batch = writeBatch(db)
      snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref))
      await batch.commit()
    }
  }
  const { deleteDoc } = await import('firebase/firestore')
  await deleteDoc(doc(db, 'groups', groupId, 'events', eventId))
}
