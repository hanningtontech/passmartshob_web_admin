# Backblaze B2 image uploads (product images)

Product images can be uploaded to **Backblaze B2** instead of (or in addition to) Firebase Storage. The admin uses a small **upload API** that generates presigned URLs so your B2 keys never go to the browser.

---

## 1. Create a Backblaze B2 bucket

1. Sign in at [Backblaze B2](https://www.backblaze.com/b2/sign-in.html).
2. Create a **Bucket** (e.g. `passmartshop-images`). Choose **Public** if you want image URLs to work without extra auth.
3. Note your bucket’s **region** (e.g. `us-west-004`, `us-east-005`). You’ll need it for the S3 endpoint.

**4. Add CORS rules to the bucket (required for browser uploads)**  
The browser sends the file directly to B2; the bucket must allow your admin origin.

1. In B2, open your bucket → **Bucket Settings** (or **CORS Rules**).
2. Add a CORS rule. Example (allows localhost admin and any future production admin URL):

| Field | Value |
|-------|--------|
| **Allowed Origins** | `http://localhost:5173` `http://localhost:5174` `http://localhost:3000` (or `*` to allow all) |
| **Allowed Operations** | `s3_put`, `s3_get` (or all) |
| **Allowed Headers** | `*` or `Content-Type` |
| **Expose Headers** | (optional) |

If your B2 console uses JSON, use something like:

```json
[
  {
    "corsRuleName": "admin-upload",
    "allowedOrigins": ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    "allowedOperations": ["s3_put", "s3_get"],
    "allowedHeaders": ["*"],
    "exposeHeaders": []
  }
]
```

Without this, the browser may block the upload and you’ll see “Failed to fetch” when sending the file to B2.

**Using the B2 web UI:** If you see options like “Share everything in this bucket with every origin” and “Apply to: Both”, choose those, then click **Update CORS Rules** and wait about 1 minute for changes to apply.

**Important:** CORS must be set on the **same bucket** that your server uses. Check `B2_BUCKET_NAME` in `server/.env` (e.g. `passmartshop-me` or `passmartshop-media`). Whichever bucket name is in `.env` is the one that needs CORS; if you configured CORS on a different bucket, either change `.env` to that bucket or set CORS on the bucket in `.env`.

---

## 2. Create an Application Key (S3-compatible)

1. In B2, go to **App Keys** and **Add a new Application Key**.
2. Name it (e.g. `admin-upload`), give it **Read and Write** access to your bucket.
3. Copy the **keyID** and **applicationKey**. You’ll use these in the server only (never in the frontend).

---

## 3. Run the B2 upload API (server)

The repo includes a small Node server that creates presigned upload URLs.

1. From the project root:
   ```bash
   cd server
   cp .env.example .env
   ```
2. Edit **`server/.env`** and set:
   ```env
   B2_KEY_ID=your_key_id
   B2_APPLICATION_KEY=your_application_key
   B2_BUCKET_NAME=your_bucket_name
   B2_REGION=us-west-004
   ```
   Use the region where your bucket lives. Optionally set **B2_PUBLIC_URL_PREFIX** if you use a custom domain or CDN for the bucket.

3. Install and run:
   ```bash
   npm install
   npm run dev
   ```
   The API runs at **http://localhost:3001** by default.

---

## 4. Point the admin app at the API

1. In the **project root** (where the Vite app lives), create or edit **`.env`**:
   ```env
   VITE_B2_UPLOAD_API=http://localhost:3001
   ```
2. Restart the admin dev server (`npm run dev`).

When **VITE_B2_UPLOAD_API** is set, the product form uses **Backblaze B2** for “Or upload files”. If it’s not set, the app falls back to **Firebase Storage** (if configured).

---

## 5. Product form behavior

- **Enter image URL** – unchanged; paste any image URL.
- **Or upload files** – if `VITE_B2_UPLOAD_API` is set, files are uploaded to B2 and the public image URL is added to the product. Otherwise Firebase Storage is used.

Product data (name, price, category, etc.) is still saved in **Firebase Firestore**; only the image file destination switches to B2 when the upload API is configured.

---

## Deploying the B2 API

For production, run the **server** somewhere that has your B2 env vars (e.g. Railway, Render, Fly.io, or a small VPS). Then set **VITE_B2_UPLOAD_API** in your admin build to that URL (e.g. `https://your-b2-api.example.com`). Do not expose **B2_APPLICATION_KEY** in the frontend.
