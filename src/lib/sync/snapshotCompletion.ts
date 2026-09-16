import type { WorkspaceImageMeta } from '../../workspace/types'
import type { QueuedProjectSnapshotWrite } from './idb'

export const buildSnapshotCompletion = (item: QueuedProjectSnapshotWrite) => ({
  projectId: item.projectId,
  revision: item.payload.revision,
  frameImages: Object.fromEntries(
    item.payload.frames.map((frame) => [
      frame.id,
      {
        contentType: frame.imageContentType,
        byteSize: frame.imageByteSize,
        width: frame.imageWidth,
        height: frame.imageHeight,
        contentHash: frame.imageContentHash,
        storagePath: frame.imagePath,
      } satisfies WorkspaceImageMeta,
    ]),
  ),
})
