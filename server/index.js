/**
 * Backblaze B2 upload API – generates presigned URLs for browser uploads.
 * Run: npm install && npm run dev
 * Set env: B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_NAME, B2_REGION, B2_PUBLIC_URL_PREFIX
 */
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const {
  B2_KEY_ID,
  B2_APPLICATION_KEY,
  B2_BUCKET_NAME,
  B2_REGION = 'us-west-004',
  B2_PUBLIC_URL_PREFIX,
  PORT = 3001,
} = process.env

const isConfigured =
  B2_KEY_ID &&
  B2_APPLICATION_KEY &&
  B2_BUCKET_NAME

const app = express()
// Allow browser requests from any origin (admin on localhost:5173, 5174, etc.)
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-File-Name'],
}))
app.use(express.json())

const s3Client =
  isConfigured &&
  new S3Client({
    region: B2_REGION,
    endpoint: `https://s3.${B2_REGION}.backblazeb2.com`,
    credentials: {
      accessKeyId: B2_KEY_ID,
      secretAccessKey: B2_APPLICATION_KEY,
    },
    forcePathStyle: true,
  })

/** Default public URL prefix if not set: bucket.s3.region.backblazeb2.com */
const publicBase =
  B2_PUBLIC_URL_PREFIX ||
  (isConfigured
    ? `https://${B2_BUCKET_NAME}.s3.${B2_REGION}.backblazeb2.com`
    : '')

/**
 * POST /api/b2-upload-url
 * Body: { fileName: string, contentType?: string }
 * Returns: { uploadUrl, publicUrl }
 */
app.post('/api/b2-upload-url', async (req, res) => {
  if (!isConfigured) {
    return res.status(503).json({
      error: 'B2 not configured',
      message: 'Set B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_NAME (and optionally B2_REGION, B2_PUBLIC_URL_PREFIX)',
    })
  }

  const { fileName, contentType } = req.body || {}
  if (!fileName || typeof fileName !== 'string') {
    return res.status(400).json({ error: 'fileName is required' })
  }

  const key = `products/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  try {
    const command = new PutObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: key,
      ContentType: contentType || 'image/jpeg',
    })
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
    const publicUrl = `${publicBase.replace(/\/$/, '')}/${key}`
    res.json({ uploadUrl, publicUrl })
  } catch (err) {
    console.error('B2 presign error:', err)
    res.status(500).json({ error: 'Failed to create upload URL', details: err.message })
  }
})

/**
 * POST /api/b2-upload (proxy upload – no CORS with B2)
 * Body: raw file bytes. Headers: Content-Type, X-File-Name (original filename).
 * Returns: { publicUrl }
 */
app.post('/api/b2-upload', express.raw({ type: () => true, limit: '25mb' }), async (req, res) => {
  if (!isConfigured) {
    return res.status(503).json({
      error: 'B2 not configured',
      message: 'Set B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_NAME',
    })
  }
  const fileName = req.headers['x-file-name']
  if (!fileName || typeof fileName !== 'string') {
    return res.status(400).json({ error: 'X-File-Name header is required' })
  }
  const key = `products/${Date.now()}-${decodeURIComponent(fileName).replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const contentType = req.headers['content-type'] || 'image/jpeg'
  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: key,
      Body: req.body,
      ContentType: contentType,
    }))
    const publicUrl = `${publicBase.replace(/\/$/, '')}/${key}`
    console.log(`Uploaded to B2: bucket=${B2_BUCKET_NAME} key=${key}`)
    res.json({ publicUrl })
  } catch (err) {
    console.error('B2 upload error:', err)
    res.status(500).json({ error: 'Upload to B2 failed', details: err.message })
  }
})

app.get('/api/health', (_, res) => {
  res.json({
    ok: true,
    b2Configured: !!isConfigured,
  })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`B2 upload API at http://localhost:${PORT}`)
  if (!isConfigured) console.warn('B2 env not set – /api/b2-upload-url will return 503')
})
