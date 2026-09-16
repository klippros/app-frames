const DB_NAME = 'app-frames'
const DB_VERSION = 1

export const STORE_BLOBS = 'project-blobs'
export const STORE_QUEUE = 'project-queue'
export const STORE_META = 'project-meta'

interface QueuedWriteBase {
  id: string
  userId: string
  projectId: string
  createdAt: string
}

export interface QueuedSnapshotFrame {
  id: string
  frameOrder: number
  settings: Record<string, unknown>
  imagePath: string
  imageContentType: 'image/webp'
  imageByteSize: number
  imageWidth?: number
  imageHeight?: number
  imageContentHash?: string
  blobKey: string
  needsImageUpload: boolean
}

export interface QueuedProjectSnapshotWrite extends QueuedWriteBase {
  kind: 'save-project-snapshot'
  payload: {
    expectedRevision: number | null
    name: string
    revision: number
    globalSettings: Record<string, unknown>
    clientUpdatedAt: string
    frames: QueuedSnapshotFrame[]
  }
}

interface QueuedProjectDeleteWrite extends QueuedWriteBase {
  kind: 'delete-project'
  payload: { projectId: string }
}

interface QueuedObjectDeleteWrite extends QueuedWriteBase {
  kind: 'delete-object'
  payload: { imagePath: string }
}

export type QueuedProjectWrite =
  QueuedProjectSnapshotWrite | QueuedProjectDeleteWrite | QueuedObjectDeleteWrite

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open IndexedDB'))
    }
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        const blobs = db.createObjectStore(STORE_BLOBS, { keyPath: 'key' })
        blobs.createIndex('byUser', 'userId', { unique: false })
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        const queue = db.createObjectStore(STORE_QUEUE, { keyPath: 'id' })
        queue.createIndex('byUser', 'userId', { unique: false })
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        const meta = db.createObjectStore(STORE_META, { keyPath: 'key' })
        meta.createIndex('byUser', 'userId', { unique: false })
      }
    }
    request.onsuccess = () => {
      resolve(request.result)
    }
  })

const withStore = async <T>(
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> => {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode)
    const store = tx.objectStore(storeName)
    let request: IDBRequest<T> | undefined
    try {
      const result = run(store)
      if (result !== undefined) {
        request = result
        request.onsuccess = () => {
          resolve(request?.result)
        }
        request.onerror = () => {
          reject(request?.error ?? new Error('IndexedDB request failed'))
        }
      }
    } catch (error) {
      reject(error)
    }
    tx.oncomplete = () => {
      if (request === undefined) {
        resolve(undefined)
      }
      db.close()
    }
    tx.onerror = () => {
      reject(tx.error ?? new Error('IndexedDB transaction failed'))
    }
  })
}

export const putBlob = async (userId: string, key: string, blob: Blob): Promise<void> => {
  await withStore(STORE_BLOBS, 'readwrite', (store) => {
    store.put({ key, userId, blob, updatedAt: new Date().toISOString() })
  })
}

export const getBlob = async (key: string): Promise<Blob | undefined> => {
  const row = await withStore<{ blob: Blob } | undefined>(STORE_BLOBS, 'readonly', (store) =>
    store.get(key),
  )
  return row?.blob
}

export const deleteBlob = async (key: string): Promise<void> => {
  await withStore(STORE_BLOBS, 'readwrite', (store) => {
    store.delete(key)
  })
}

/** Delete IndexedDB blobs whose key starts with `{userId}/{projectId}`. */
export const deleteBlobsByProjectPrefix = async (
  userId: string,
  projectId: string,
): Promise<void> => {
  const prefix = `${userId}/${projectId}`
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_BLOBS, 'readwrite')
    const store = tx.objectStore(STORE_BLOBS)
    const index = store.index('byUser')
    const request = index.openCursor(IDBKeyRange.only(userId))
    request.onsuccess = () => {
      const cursor = request.result
      if (!cursor) {
        return
      }
      const row = cursor.value as { key?: unknown }
      let key = ''
      if (typeof row.key === 'string') {
        key = row.key
      } else if (typeof cursor.primaryKey === 'string') {
        key = cursor.primaryKey
      }
      if (key === prefix || key.startsWith(`${prefix}/`)) {
        cursor.delete()
      }
      cursor.continue()
    }
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      reject(tx.error ?? new Error('Failed to delete project blobs'))
    }
  })
}

export const enqueueWrite = async (item: QueuedProjectWrite): Promise<void> => {
  await withStore(STORE_QUEUE, 'readwrite', (store) => {
    store.put(item)
  })
}

export const listQueueForUser = async (userId: string): Promise<QueuedProjectWrite[]> => {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readonly')
    const store = tx.objectStore(STORE_QUEUE)
    const index = store.index('byUser')
    const request = index.getAll(userId)
    request.onsuccess = () => {
      const items = (request.result as QueuedProjectWrite[]).sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt),
      )
      resolve(items)
    }
    request.onerror = () => {
      reject(request.error ?? new Error('Failed to list queue'))
    }
    tx.oncomplete = () => {
      db.close()
    }
  })
}

export const dequeueWrite = async (id: string): Promise<void> => {
  await withStore(STORE_QUEUE, 'readwrite', (store) => {
    store.delete(id)
  })
}

export const clearUserData = async (userId: string): Promise<void> => {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_BLOBS, STORE_QUEUE, STORE_META], 'readwrite')
    for (const storeName of [STORE_BLOBS, STORE_QUEUE, STORE_META]) {
      const store = tx.objectStore(storeName)
      const index = store.index('byUser')
      const request = index.openCursor(IDBKeyRange.only(userId))
      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        }
      }
    }
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      reject(tx.error ?? new Error('Failed to clear user data'))
    }
  })
}

export const clearAllAppData = async (): Promise<void> => {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_BLOBS, STORE_QUEUE, STORE_META], 'readwrite')
    for (const storeName of [STORE_BLOBS, STORE_QUEUE, STORE_META]) {
      tx.objectStore(storeName).clear()
    }
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      reject(tx.error ?? new Error('Failed to clear app data'))
    }
  })
}
