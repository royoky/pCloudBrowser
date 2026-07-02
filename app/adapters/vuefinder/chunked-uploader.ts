/**
 * Uppy custom uploader: chunked upload via our neutral upload-session API.
 *
 * Per file: POST /upload/create -> uploadId, then PUT /upload/write per chunk
 * (raw body, byte offset), then POST /upload/save to finalize. Each chunk is an
 * independent small request, so uploads aren't bounded by the platform's
 * request-body / memory limit, and per-chunk `upload-progress` events drive a
 * real progress bar.
 *
 * This is the one place coupled to Uppy's plugin API; the rest of the adapter
 * only maps DTOs.
 */

import type { Body, Meta, PluginOpts, Uppy } from '@uppy/core'
import { BasePlugin } from '@uppy/core'

const DEFAULT_CHUNK_SIZE = 20 * 1024 * 1024 // 20 MB — safely under the platform body limit

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
  private readonly chunkSize: number

  constructor(uppy: Uppy<M, B>, opts: ChunkedUploaderOpts) {
    super(uppy, opts)
    this.id = this.opts.id || 'PCloudChunkedUploader'
    this.type = 'uploader'
    this.chunkSize = this.opts.chunkSize ?? DEFAULT_CHUNK_SIZE
  }

  private readonly uploadOne = async (fileId: string): Promise<void> => {
    const { base } = this.opts
    const file = this.uppy.getFile(fileId)
    const blob = file.data
    // Uppy types `data` as possibly a metadata-only ghost (restored/remote
    // files); a real local upload always has a Blob.
    if (!(blob instanceof Blob))
      throw new TypeError('File has no readable data')
    const total = blob.size
    const uploadStarted = Date.now()
    // Capture the destination at upload start so navigating mid-upload can't
    // retarget the file.
    const targetPath = this.opts.getTargetPath()

    try {
      const { uploadId } = await $fetch<{ uploadId: string }>(`${base}/upload/create`, {
        method: 'POST',
      })

      for (let offset = 0; offset < total; offset += this.chunkSize) {
        const chunk = blob.slice(offset, Math.min(offset + this.chunkSize, total))
        await $fetch(`${base}/upload/write`, {
          method: 'PUT',
          query: { uploadId, offset },
          body: await chunk.arrayBuffer(),
        })

        this.uppy.emit('upload-progress', this.uppy.getFile(fileId), {
          uploadStarted,
          bytesUploaded: Math.min(offset + this.chunkSize, total),
          bytesTotal: total,
        })
      }

      const item = await $fetch(`${base}/upload/save`, {
        method: 'POST',
        body: { uploadId, path: targetPath, name: file.name ?? 'upload' },
      })

      this.uppy.emit('upload-success', this.uppy.getFile(fileId), {
        status: 200,
        body: item as B,
        uploadURL: undefined,
      })
    }
    catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.uppy.emit('upload-error', this.uppy.getFile(fileId), error)
      throw error
    }
  }

  private readonly handleUpload = async (fileIDs: string[]): Promise<void> => {
    if (!fileIDs.length)
      return
    await Promise.allSettled(fileIDs.map(this.uploadOne))
  }

  override install(): void {
    this.uppy.addUploader(this.handleUpload)
  }

  override uninstall(): void {
    this.uppy.removeUploader(this.handleUpload)
  }
}
