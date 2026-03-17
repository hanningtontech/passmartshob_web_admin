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

## Host the B2 upload API (stop using it locally)

To use B2 uploads from the **deployed** admin (e.g. https://passmartshop-admin.web.app) without running the server on your machine, deploy the **server** to a cloud host and point the admin build at that URL.

### Option A: Render (recommended – free tier, simple)

1. **Push your repo** to GitHub (if not already).

2. **Create a Web Service on Render**
   - Go to [render.com](https://render.com) → Sign up / Log in.
   - **Dashboard** → **New** → **Web Service**.
   - Connect your GitHub account and select the **passmartshob_web_admin** repo (or the repo that contains the `server/` folder).

3. **Configure the service**
   - **Name:** e.g. `passmartshop-b2-upload`.
   - **Region:** choose one close to you.
   - **Root Directory:** set to **`server`** (so Render runs the Node app in `server/`).
   - **Runtime:** Node.
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free (or paid if you need no cold starts).

4. **Environment variables** (Render → your service → **Environment**)
   Add these (use **Secret** for keys):

   | Key | Value |
   |-----|--------|
   | `B2_KEY_ID` | Your B2 Application Key ID |
   | `B2_APPLICATION_KEY` | Your B2 Application Key (secret) |
   | `B2_BUCKET_NAME` | Your bucket name (e.g. `passmartshop-media`) |
   | `B2_REGION` | e.g. `us-west-004` |
   | `B2_PUBLIC_URL_PREFIX` | (optional) Public URL base for images |
   | `NODE_ENV` | `production` |

   Do **not** set `PORT` – Render sets it automatically.

5. **Deploy**
   Click **Create Web Service**. Render will build and deploy. When it’s live, you’ll get a URL like **`https://passmartshop-b2-upload.onrender.com`**.

6. **Point the admin at the hosted API**
   - In the **admin app root** (where the Vite app lives), create or edit **`.env.production`**:
     ```env
     VITE_B2_UPLOAD_API=https://passmartshop-b2-upload.onrender.com
     ```
     Use your actual Render URL (no trailing slash).
   - Rebuild and redeploy the admin:
     ```bash
     npm run build
     firebase deploy --only hosting
     ```
   - The admin at https://passmartshop-admin.web.app will now use the hosted B2 API for uploads; you can stop running the server locally.

**Render free tier note:** The service may sleep after inactivity; the first request after sleep can be slow (cold start). For always-on, use a paid instance.

**If you get "Not found"** when opening the service URL or `/api/health`, the Node server is not running. Fix it:

1. In **Render Dashboard** → open your **passmartshop-b2-upload** (or whatever you named it) service.
2. Go to **Settings** (left sidebar).
3. Find **Root Directory**. If it’s empty or not `server`, set it to **`server`** (only that word, no path).
4. Click **Save Changes**.
5. Go to **Manual Deploy** → **Deploy latest commit** (or push a commit to trigger a deploy).
6. Wait for the deploy to finish (green **Live**). Then open **https://your-service.onrender.com/api/health** again.

The repo root has a Vite app; the B2 API lives in **server/** so Render must use **Root Directory: server**.

---

### Option B: Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub** → select your repo.
2. Add a **service** and set **Root Directory** to `server`.
3. **Variables:** Add `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_NAME`, `B2_REGION` (and optional `B2_PUBLIC_URL_PREFIX`). Railway sets `PORT` automatically.
4. Deploy; Railway gives you a URL like `https://your-app.up.railway.app`.
5. Set **`.env.production`** in the admin root: `VITE_B2_UPLOAD_API=https://your-app.up.railway.app`, then rebuild and redeploy the admin.

---

### Option C: Fly.io or a VPS

- **Fly.io:** Use `fly launch` in the `server/` directory and set secrets with `fly secrets set B2_KEY_ID=...` etc. Then use the deployed app URL as `VITE_B2_UPLOAD_API`.
- **VPS (e.g. DigitalOcean, Linode):** Install Node, clone the repo, run the server with `pm2` or systemd, put it behind nginx with HTTPS. Use that URL as `VITE_B2_UPLOAD_API`.

---

### Summary

| Step | What to do |
|------|------------|
| 1 | Deploy the **server** (e.g. Render) with B2 env vars; note the public URL. |
| 2 | In admin root, set **`.env.production`** with `VITE_B2_UPLOAD_API=https://your-b2-api-url`. |
| 3 | Run **`npm run build`** then **`firebase deploy --only hosting`** so the admin build bakes in that URL. |
| 4 | Stop running the server locally; uploads from the live admin go to your hosted API → B2. |

Never put **B2_APPLICATION_KEY** (or any B2 secret) in the frontend or in `VITE_*` – only in the server’s environment on the host.
