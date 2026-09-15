import type { SupabaseClient } from '@supabase/supabase-js'
import type { Workspace, WorkspaceFrame } from '../../workspace/types'
import { downloadProjectImage, getProjectWithFrames } from './projectGateway'
import { getBlob, putBlob } from './idb'

const blobKey = (userId: string, projectId: string, frameId: string) =>
  `${userId}/${projectId}/${frameId}`

export const hydrateProjectWorkspace = async (
  client: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<Workspace | null> => {
  const loaded = await getProjectWithFrames(client, projectId)
  if (!loaded || loaded.project.user_id !== userId) {
    return null
  }

  const frames: WorkspaceFrame[] = []
  for (const row of loaded.frames) {
    const key = blobKey(userId, projectId, row.id)
    let blob = await getBlob(key)

    if (!blob) {
      try {
        blob = await downloadProjectImage(client, row.image_path)
        await putBlob(userId, key, blob)
      } catch {
        // Frame metadata can exist before the object finished uploading; skip it.
        continue
      }
    }

    const file = new File([blob], `${row.id}.webp`, { type: 'image/webp' })
    frames.push({
      id: row.id,
      order: row.frame_order,
      settings: row.settings as unknown as WorkspaceFrame['settings'],
      file,
      url: URL.createObjectURL(file),
      image: {
        contentType: row.image_content_type,
        byteSize: row.image_byte_size,
        width: row.image_width ?? undefined,
        height: row.image_height ?? undefined,
        contentHash: row.image_content_hash ?? undefined,
        storagePath: row.image_path,
      },
    })
  }

  return {
    schemaVersion: 1,
    kind: 'project',
    id: loaded.project.id,
    name: loaded.project.name,
    ownerId: loaded.project.user_id,
    revision: loaded.project.revision,
    syncedRevision: loaded.project.revision,
    updatedAt: loaded.project.updated_at,
    globalSettings: loaded.project.global_settings as unknown as Workspace['globalSettings'],
    frames,
  }
}
