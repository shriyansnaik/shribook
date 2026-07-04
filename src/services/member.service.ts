import {
  collection, doc, addDoc, updateDoc, getDocs, query, where, serverTimestamp, increment,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { MemberRole } from '@/types'

// Rebuild the group's mirrored email arrays from its active members. These power
// email-based feed discovery and the security rules (memberEmails / approverEmails).
async function syncGroupAccess(groupId: string) {
  const snap = await getDocs(
    query(collection(db, 'groups', groupId, 'members'), where('isActive', '==', true))
  )
  const memberEmails = new Set<string>()
  const approverEmails = new Set<string>()
  snap.docs.forEach((d) => {
    const m = d.data()
    const email = (m.email ?? '').trim().toLowerCase()
    if (!email) return
    memberEmails.add(email)
    if (m.isApprover) approverEmails.add(email)
  })
  await updateDoc(doc(db, 'groups', groupId), {
    memberEmails: [...memberEmails],
    approverEmails: [...approverEmails],
  })
}

export async function addMember(
  groupId: string,
  data: { name: string; phone?: string; email?: string; role: MemberRole; isApprover: boolean },
  addedBy: string
) {
  const ref = await addDoc(collection(db, 'groups', groupId, 'members'), {
    name: data.name.trim(),
    phone: data.phone?.trim() || null,
    email: data.email?.trim() || null,
    role: data.role,
    isApprover: data.isApprover,
    addedAt: serverTimestamp(),
    addedBy,
    isActive: true,
    linkedUid: null,
  })
  await updateDoc(doc(db, 'groups', groupId), { memberCount: increment(1) })
  await syncGroupAccess(groupId)
  return ref
}

export async function updateMember(
  groupId: string,
  memberId: string,
  data: { name?: string; phone?: string | null; email?: string | null; role?: MemberRole; isApprover?: boolean }
) {
  await updateDoc(doc(db, 'groups', groupId, 'members', memberId), data)
  await syncGroupAccess(groupId)
}

export async function deactivateMember(groupId: string, memberId: string) {
  await updateDoc(doc(db, 'groups', groupId, 'members', memberId), { isActive: false })
  await updateDoc(doc(db, 'groups', groupId), { memberCount: increment(-1) })
  await syncGroupAccess(groupId)
}
