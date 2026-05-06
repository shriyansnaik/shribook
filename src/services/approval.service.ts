import {
  collection, doc, writeBatch, updateDoc, getDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { ACTIVITY_ACTIONS, MIN_APPROVALS_REQUIRED } from '@/lib/constants'
import { buildLogEntry } from './activityLog.service'
import type { ChangeType, Approval } from '@/types'
import {
  cancelAttendance, addAttendee, updateExpense, deleteExpense,
} from './event.service'

export async function requestApproval(
  groupId: string,
  eventId: string,
  changeType: ChangeType,
  changeDescription: string,
  changePayload: Record<string, unknown>,
  adminCount: number,
  actorUid: string,
  actorName: string
) {
  const requiredApprovals = adminCount > 1 ? MIN_APPROVALS_REQUIRED : 0
  const batch = writeBatch(db)

  const approvalRef = doc(collection(db, 'groups', groupId, 'events', eventId, 'approvals'))
  batch.set(approvalRef, {
    requestedAt: serverTimestamp(),
    requestedBy: actorUid,
    changeDescription,
    changeType,
    changePayload,
    status: 'pending',
    votes: {},
    resolvedAt: null,
    resolvedBy: null,
    requiredApprovals,
  })

  const logRef = doc(collection(db, 'groups', groupId, 'events', eventId, 'activityLog'))
  batch.set(logRef, buildLogEntry(actorUid, actorName, ACTIVITY_ACTIONS.APPROVAL_REQUESTED, `Edit requested: ${changeDescription}`))

  batch.update(doc(db, 'groups', groupId, 'events', eventId), { status: 'pending_approval' })

  await batch.commit()
  return approvalRef.id
}

export async function castVote(
  groupId: string,
  eventId: string,
  approvalId: string,
  vote: 'approve' | 'reject',
  voterUid: string,
  voterName: string,
  ratePerSong: number
) {
  const approvalRef = doc(db, 'groups', groupId, 'events', eventId, 'approvals', approvalId)
  const snap = await getDoc(approvalRef)
  if (!snap.exists()) throw new Error('Approval not found')

  const approval = { id: snap.id, ...snap.data() } as Approval
  const updatedVotes = {
    ...approval.votes,
    [voterUid]: { vote, votedAt: serverTimestamp(), voterName },
  }

  const approveCount = Object.values(updatedVotes).filter((v) => v.vote === 'approve').length
  const rejectCount = Object.values(updatedVotes).filter((v) => v.vote === 'reject').length
  const shouldApprove = approveCount >= approval.requiredApprovals
  const shouldReject = rejectCount > 0

  const batch = writeBatch(db)
  batch.update(approvalRef, {
    votes: updatedVotes,
    ...(shouldApprove || shouldReject
      ? { status: shouldApprove ? 'approved' : 'rejected', resolvedAt: serverTimestamp(), resolvedBy: voterUid }
      : {}),
  })

  const logRef = doc(collection(db, 'groups', groupId, 'events', eventId, 'activityLog'))
  batch.set(logRef, buildLogEntry(voterUid, voterName, ACTIVITY_ACTIONS.APPROVAL_CAST, `${voterName} ${vote}d the edit request`))

  await batch.commit()

  // Apply the change if fully approved
  if (shouldApprove) {
    await applyApprovedChange(groupId, eventId, approval, ratePerSong, voterUid, voterName)
    await updateDoc(doc(db, 'groups', groupId, 'events', eventId), { status: 'locked' })
  } else if (shouldReject) {
    await updateDoc(doc(db, 'groups', groupId, 'events', eventId), { status: 'locked' })
  }
}

async function applyApprovedChange(
  groupId: string,
  eventId: string,
  approval: Approval,
  ratePerSong: number,
  actorUid: string,
  actorName: string
) {
  const p = approval.changePayload

  switch (approval.changeType) {
    case 'cancel_singer':
      await cancelAttendance(groupId, eventId, p.attendanceId as string, p.refundIssued as boolean, actorUid, actorName)
      break
    case 'add_singer':
      await addAttendee(groupId, eventId, ratePerSong, { memberId: p.memberId as string, memberName: p.memberName as string, songCount: p.songCount as number }, actorUid, actorName)
      break
    case 'edit_expense':
      await updateExpense(groupId, eventId, p.expenseId as string, { vendor: p.vendor as string, amount: p.amount as number, notes: p.notes as string }, actorUid, actorName)
      break
    case 'delete_expense':
      await deleteExpense(groupId, eventId, p.expenseId as string, actorUid, actorName)
      break
  }
}
