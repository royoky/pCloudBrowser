/**
 * Uppy custom uploader: the glue between Uppy's plugin API and our chunked
 * upload (see `upload-session.ts`). It emits the events VueFinder's upload
 * modal relies on and stops network calls when the user cancels.
 *
 * This is the one place coupled to Uppy's plugin API; the rest of the adapter
 * only maps DTOs.
 */

import type { Body, Meta, PluginOpts, Uppy } from '@uppy/core'
import { BasePlugin } from '@uppy/core'
import { uploadInChunks } from './upload-session'

const HTTP_STATUS_OK = 200

export interface ChunkedUploaderOpts extends PluginOpts {
  /** Provider API base, e.g. `/api/pcloud`. */
  base: string
  /** Returns the neutral target directory path at upload time. */
  getTargetPath: () => string
  chunkSize?: number
}

export class ChunkedUploader<M extends Meta, B extends Body> extends BasePlugin<
  ChunkedUploaderOpts,
  M,
  B
> {
  /** In-flight uploads by Uppy file id, so a cancel can stop the network calls. */
  private readonly uploads = new Map<string, AbortController>()

  constructor(uppy: Uppy<M, B>, opts: ChunkedUploaderOpts) {
    super(uppy, opts)
    this.id = this.opts.id || 'PCloudChunkedUploader'
    this.type = 'uploader'
  }

  private readonly uploadOne = async (fileId: string): Promise<void> => {
    const file = this.uppy.getFile(fileId)
    const blob = file.data
    // Uppy types `data` as possibly a metadata-only ghost (restored/remote
    // files); a real local upload always has a Blob.
    if (!(blob instanceof Blob))
      throw new TypeError('File has no readable data')
    const total = blob.size
    const uploadStarted = Date.now()
    const controller = new AbortController()
    this.uploads.set(fileId, controller)

    try {
      const item = await uploadInChunks(blob, {
        base: this.opts.base,
        // Captured at upload start so navigating mid-upload can't retarget the file.
        targetPath: this.opts.getTargetPath(),
        name: file.name ?? 'upload',
        chunkSize: this.opts.chunkSize,
        signal: controller.signal,
        onProgress: (sent) => {
          // Capped below `total` so the UI doesn't read 100% while the server
          // is still forwarding the last chunk and finalizing the file.
          this.uppy.emit('upload-progress', this.uppy.getFile(fileId), {
            uploadStarted,
            bytesUploaded: Math.min(sent, total - 1),
            bytesTotal: total,
          })
        },
      })

      this.uppy.emit('upload-success', this.uppy.getFile(fileId), {
        status: HTTP_STATUS_OK,
        body: item as B,
        uploadURL: undefined,
      })
    }
    catch (err) {
      // A cancel is not a failure: VueFinder already marks the entry "Canceled".
      if (controller.signal.aborted)
        return
      const error = err instanceof Error ? err : new Error(String(err))
      this.uppy.emit('upload-error', this.uppy.getFile(fileId), error)
      throw error
    }
    finally {
      this.uploads.delete(fileId)
    }
  }

  private readonly cancelAll = (): void => {
    this.uploads.forEach(controller => controller.abort())
  }

  private readonly cancelFile = (file: { id: string }): void => {
    this.uploads.get(file.id)?.abort()
  }

  private readonly handleUpload = async (fileIDs: string[]): Promise<void> => {
    if (!fileIDs.length)
      return
    // Uppy core never emits `upload-start`: the uploader plugin must (as
    // @uppy/xhr-upload does). VueFinder's queue only switches a file from
    // "Pending upload" to "Uploading x%" on this event, so without it the
    // modal shows no progress at all.
    this.uppy.emit('upload-start', this.uppy.getFilesByIds(fileIDs))
    await Promise.allSettled(fileIDs.map(this.uploadOne))
  }

  override install(): void {
    this.uppy.addUploader(this.handleUpload)
    this.uppy.on('cancel-all', this.cancelAll)
    this.uppy.on('file-removed', this.cancelFile)
  }

  override uninstall(): void {
    this.uppy.removeUploader(this.handleUpload)
    this.uppy.off('cancel-all', this.cancelAll)
    this.uppy.off('file-removed', this.cancelFile)
    this.cancelAll()
  }
}
