import {
  collection, doc, updateDoc, getDocs,
  query, where, arrayUnion, arrayRemove, serverTimestamp, writeBatch,
} from 'firebase/firestore'
import { db } from '@/config/firebase'

export async function createGroup(
  data: { name: string; defaultRatePerSong: number },
  userId: string,
  userDisplayName: string
): Promise<string> {
  const batch = writeBatch(db)

  const groupRef = doc(collection(db, 'groups'))
  batch.set(groupRef, {
    name: data.name,
    defaultRatePerSong: data.defaultRatePerSong,
    createdAt: serverTimestamp(),
    createdBy: userId,
    admins: [userId],
    members: [userId],
  })

  const memberRef = doc(collection(db, 'groups', groupRef.id, 'members'))
  batch.set(memberRef, {
    name: userDisplayName,
    phone: null,
    email: null,
    addedAt: serverTimestamp(),
    addedBy: userId,
    isActive: true,
    linkedUid: userId,
  })

  await batch.commit()
  return groupRef.id
}

export async function updateGroup(
  groupId: string,
  data: { name?: string; defaultRatePerSong?: number }
) {
  await updateDoc(doc(db, 'groups', groupId), data)
}

export async function addAdminToGroup(groupId: string, uid: string) {
  await updateDoc(doc(db, 'groups', groupId), {
    admins: arrayUnion(uid),
    members: arrayUnion(uid),
  })
}

export async function removeAdminFromGroup(groupId: string, uid: string) {
  await updateDoc(doc(db, 'groups', groupId), {
    admins: arrayRemove(uid),
  })
}

export async function getGroupsByUser(userId: string) {
  const q = query(collection(db, 'groups'), where('members', 'array-contains', userId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
