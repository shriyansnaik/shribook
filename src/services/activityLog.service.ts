import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'

export function buildLogEntry(
  actorUid: string,
  actorName: string,
  action: string,
  description: string,
  metadata: Record<string, unknown> | null = null
) {
  return {
    timestamp: serverTimestamp(),
    actorUid,
    actorName,
    action,
    description,
    metadata,
  }
}

export async function logActivity(
  groupId: string,
  eventId: string,
  actorUid: string,
  actorName: string,
  action: string,
  description: string,
  metadata: Record<string, unknown> | null = null
) {
  const ref = doc(collection(db, 'groups', groupId, 'events', eventId, 'activityLog'))
  const batch = writeBatch(db)
  batch.set(ref, buildLogEntry(actorUid, actorName, action, description, metadata))
  await batch.commit()
}
