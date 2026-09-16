/* oxlint-disable typescript/no-confusing-void-expression -- IndexedDB event handlers directly settle test promises. */
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearUserData,
  enqueueWrite,
  listQueueForUser,
  putBlob,
  STORE_BLOBS,
  STORE_QUEUE,
} from './idb'

const DB_NAME = 'app-frames'

const deleteDatabase = () =>
  new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })

const rowsForUser = async (storeName: string, userId: string) => {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  const rows = await new Promise<unknown[]>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const request = tx.objectStore(storeName).index('byUser').getAll(userId)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  db.close()
  return rows
}

const queueItem = (userId: string) => ({
  id: `${userId}-write`,
  userId,
  projectId: `${userId}-project`,
  createdAt: '2026-09-16T10:00:00.000Z',
  kind: 'delete-project' as const,
  payload: { projectId: `${userId}-project` },
})

describe('clearUserData', () => {
  beforeEach(async () => {
    await deleteDatabase()
  })

  it('clears only the selected user from blob and snapshot queue stores', async () => {
    await putBlob('user-a', 'user-a/blob', new Blob(['a']))
    await putBlob('user-b', 'user-b/blob', new Blob(['b']))
    await enqueueWrite(queueItem('user-a'))
    await enqueueWrite(queueItem('user-b'))
    await clearUserData('user-a')

    await expect(rowsForUser(STORE_BLOBS, 'user-a')).resolves.toHaveLength(0)
    await expect(listQueueForUser('user-a')).resolves.toHaveLength(0)
    await expect(rowsForUser(STORE_BLOBS, 'user-b')).resolves.toHaveLength(1)
    await expect(listQueueForUser('user-b')).resolves.toHaveLength(1)
    await expect(rowsForUser(STORE_QUEUE, 'user-b')).resolves.toHaveLength(1)
  })
})
