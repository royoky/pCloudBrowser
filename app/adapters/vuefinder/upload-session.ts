/**
 * Chunked upload over our neutral upload-session API, independent of Uppy.
 *
 * POST /upload/create -> uploadId, then PUT /upload/write per chunk (raw body,
 * byte offset), then POST /upload/save to finalize. Each chunk is an
 * independent small request, so uploads aren't bounded by the platform's
 * request-body / memory limit.
 */

const DEFAULT_CHUNK_SIZE = 20 * 1024 * 1024 // 20 MB — safely under the platform body limit

// HTTP status codes: bounds of the 2xx success range.
const HTTP_STATUS_OK = 200
const HTTP_STATUS_MULTIPLE_CHOICES = 300

export interface UploadSessionOptions {
  /** Provider API base, e.g. `/api/pcloud`. */
  base: string
  /** Neutral target directory path. */
  targetPath: string
  /** File name to create in the target directory. */
  name: string
  chunkSize?: number
  /** Aborting stops the in-flight request and prevents `save`. */
  signal: AbortSignal
  /** Bytes sent so far, updated continuously during each chunk. */
  onProgress: (bytesSent: number) => void
}

/** Server error message from a JSON error body, else a generic one with the status. */
function errorMessage(xhr: XMLHttpRequest): string {
  const fallback = `Upload failed (${xhr.status})`
  try {
    return JSON.parse(xhr.responseText).message ?? fallback
  }
  catch {
    // Not a JSON body (e.g. a proxy or platform error page): the status is all we have.
    return fallback
  }
}

/**
 * PUT a chunk with byte-level progress. `fetch`/`$fetch` expose no upload
 * progress, so this uses XHR: without it the UI stays at 0% until a whole
 * chunk (up to 20 MB) has been sent, i.e. for the entire upload of most files.
 */
function putChunk(
  url: string,
  body: Blob,
  onProgress: (sent: number) => void,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted)
      return reject(signal.reason)
    const xhr = new XMLHttpRequest()
    signal.addEventListener('abort', () => xhr.abort(), { once: true })
    xhr.onabort = () => reject(signal.reason)
    xhr.open('PUT', url)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress(event.loaded)
    }
    xhr.onload = () => {
      if (xhr.status >= HTTP_STATUS_OK && xhr.status < HTTP_STATUS_MULTIPLE_CHOICES)
        return resolve()
      reject(new Error(errorMessage(xhr)))
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(body)
  })
}

/** Uploads `blob` and returns the created item as the server describes it. */
export async function uploadInChunks(blob: Blob, options: UploadSessionOptions): Promise<unknown> {
  const { base, targetPath, name, chunkSize = DEFAULT_CHUNK_SIZE, signal, onProgress } = options

  const { uploadId } = await $fetch<{ uploadId: string }>(`${base}/upload/create`, {
    method: 'POST',
    signal,
  })

  for (let offset = 0; offset < blob.size; offset += chunkSize) {
    const query = new URLSearchParams({ uploadId, offset: String(offset) })
    // Sequential on purpose: one in-flight chunk bounds memory and keeps
    // progress monotonic.
    await putChunk( // NOSONAR
      `${base}/upload/write?${query}`,
      blob.slice(offset, offset + chunkSize),
      sent => onProgress(offset + sent),
      signal,
    )
  }

  // Past this point the file gets created, so the last chance to cancel.
  signal.throwIfAborted()
  return $fetch(`${base}/upload/save`, {
    method: 'POST',
    body: { uploadId, path: targetPath, name },
  })
}
