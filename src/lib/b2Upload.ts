/**
 * Upload a file to Backblaze B2 via our server (proxy upload – avoids B2 CORS).
 * Set VITE_B2_UPLOAD_API (e.g. http://localhost:3001) to enable B2 uploads.
 */

const B2_API = import.meta.env.VITE_B2_UPLOAD_API as string | undefined

export const isB2Configured = Boolean(B2_API?.trim())

/**
 * Upload a file to B2; returns the public URL on success.
 * Uses server proxy so the browser never talks to B2 (no CORS needed on bucket).
 */
export async function uploadFileToB2(file: File): Promise<string> {
  if (!isB2Configured) throw new Error('B2 upload API not configured (VITE_B2_UPLOAD_API)')
  const base = B2_API!.replace(/\/$/, '')
  let res: Response
  try {
    res = await fetch(`${base}/api/b2-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'image/jpeg',
        'X-File-Name': encodeURIComponent(file.name),
      },
      body: file,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network error'
    throw new Error(`Cannot reach B2 upload server at ${base}. Is it running? ${msg}`)
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.message || err.error || `Upload failed: ${res.status}`)
  }
  const data = await res.json()
  return data.publicUrl
}
