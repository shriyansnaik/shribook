import {
  collection, doc, addDoc, updateDoc, serverTimestamp, increment,
} from 'firebase/firestore'
import { db } from '@/config/firebase'

export async function addMember(
  groupId: string,
  data: { name: string; phone?: string; email?: string },
  addedBy: string
) {
  const ref = await addDoc(collection(db, 'groups', groupId, 'members'), {
    name: data.name.trim(),
    phone: data.phone?.trim() || null,
    email: data.email?.trim() || null,
    addedAt: serverTimestamp(),
    addedBy,
    isActive: true,
    linkedUid: null,
  })
  await updateDoc(doc(db, 'groups', groupId), { memberCount: increment(1) })
  return ref
}

export async function bulkAddMembers(groupId: string, names: string[], addedBy: string) {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))]
  await Promise.all(unique.map((name) => addDoc(collection(db, 'groups', groupId, 'members'), {
    name,
    phone: null,
    email: null,
    addedAt: serverTimestamp(),
    addedBy,
    isActive: true,
    linkedUid: null,
  })))
  await updateDoc(doc(db, 'groups', groupId), { memberCount: increment(unique.length) })
}

export async function updateMember(
  groupId: string,
  memberId: string,
  data: { name?: string; phone?: string | null; email?: string | null }
) {
  await updateDoc(doc(db, 'groups', groupId, 'members', memberId), data)
}

export async function deactivateMember(groupId: string, memberId: string) {
  await updateDoc(doc(db, 'groups', groupId, 'members', memberId), { isActive: false })
  await updateDoc(doc(db, 'groups', groupId), { memberCount: increment(-1) })
}
