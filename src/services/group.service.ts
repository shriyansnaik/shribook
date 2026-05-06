import {
  collection, doc, setDoc, updateDoc, getDocs,
  query, where, arrayUnion, arrayRemove, serverTimestamp, writeBatch,
} from 'firebase/firestore'
import { db } from '@/config/firebase'

export async function createGroup(
  data: { name: string; defaultRatePerSong: number },
  userId: string,
  userDisplayName: string
): Promise<string> {
  const groupRef = doc(collection(db, 'groups'))

  // Write group doc first so isGroupAdmin() can resolve for the member write below
  await setDoc(groupRef, {
    name: data.name,
    defaultRatePerSong: data.defaultRatePerSong,
    createdAt: serverTimestamp(),
    createdBy: userId,
    admins: [userId],
    members: [userId],
  })

  await setDoc(doc(collection(db, 'groups', groupRef.id, 'members')), {
    name: userDisplayName,
    phone: null,
    email: null,
    addedAt: serverTimestamp(),
    addedBy: userId,
    isActive: true,
    linkedUid: userId,
  })

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

export async function deleteGroup(groupId: string) {
  const BATCH_LIMIT = 400

  const deleteDocs = async (refs: import('firebase/firestore').DocumentReference[]) => {
    for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db)
      refs.slice(i, i + BATCH_LIMIT).forEach((r) => batch.delete(r))
      await batch.commit()
    }
  }

  // Delete members subcollection
  const membersSnap = await getDocs(collection(db, 'groups', groupId, 'members'))
  await deleteDocs(membersSnap.docs.map((d) => d.ref))

  // Delete events and all their subcollections
  const eventsSnap = await getDocs(collection(db, 'groups', groupId, 'events'))
  for (const eventDoc of eventsSnap.docs) {
    const eventId = eventDoc.id
    const subcolls = ['attendance', 'expenses', 'approvals', 'activityLog']
    for (const sub of subcolls) {
      const subSnap = await getDocs(collection(db, 'groups', groupId, 'events', eventId, sub))
      await deleteDocs(subSnap.docs.map((d) => d.ref))
    }
    await deleteDocs([eventDoc.ref])
  }

  // Delete the group doc itself
  const { deleteDoc } = await import('firebase/firestore')
  await deleteDoc(doc(db, 'groups', groupId))
}
