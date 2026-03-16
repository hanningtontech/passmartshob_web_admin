# Deploy Admin App to Firebase Hosting

Step-by-step guide to deploy this admin web app to Firebase Hosting **without overwriting the user storefront**.

**Two sites in project `passmartshop`:**
- **Default site** (`passmartshop`) = user storefront at **passmart.com** / passmartshop.web.app. Deploy only from `design/` (in the main passmartshop_web repo).
- **Admin site** (`passmartshop-admin`) = this admin app at **https://passmartshop-admin.web.app**. Deploy only from this repo. This repo’s `firebase.json` includes `"site": "passmartshop-admin"` so deploys never touch the storefront.

---

## 1. Project analysis (done)

| Item | Value |
|------|--------|
| **Admin app root** | This repo root: `passmartshob_web_admin` (where `package.json` and `vite.config.ts` live) |
| **Build tool** | Vite (`npm run build` → `tsc && vite build`) |
| **Build output folder** | `dist` (Vite default; no custom `outDir` in `vite.config.ts`) |
| **SPA?** | Yes. React Router with client-side routes (`/login`, `/admin`, `/admin/categories`, etc.). All routes must serve `index.html`. |

Firebase Hosting is already configured in this repo:

- **`firebase.json`**: `hosting.site` = `passmartshop-admin`, `hosting.public` = `dist`, with SPA rewrites (`**` → `/index.html`). The `site` value ensures deploys go only to the admin URL, not the user shop.
- **`.firebaserc`**: Created when you run `firebase use <project-id>` (see below).

---

## 2. CLI setup

Firebase CLI is installed (e.g. `firebase --version` shows 15.x). If you ever need to install or reinstall:

```bash
npm install -g firebase-tools
```

---

## 3. Initialization (from admin app root only)

All Firebase commands must be run from the **admin app root** (this directory), not the repo root of another app or a `design/` folder.

1. **Log in (if needed)**  
   From the admin app root:
   ```bash
   firebase login
   ```

2. **Create or link a Firebase project**  
   - **Option A – Use existing project (e.g. same as storefront)**  
     From the admin app root:
     ```bash
     firebase use <your-firebase-project-id>
     ```
     This creates or updates `.firebaserc` with `projects.default = <your-firebase-project-id>`.
   - **Option B – Create a new project and use it**  
     Create the project in the [Firebase Console](https://console.firebase.google.com/), then:
     ```bash
     firebase use <new-project-id>
     ```

3. **Optional: run init (only if you want to reconfigure hosting)**  
   Hosting is already set in `firebase.json`. If you prefer to run the wizard anyway:
   ```bash
   firebase init hosting
   ```
   When prompted:
   - **“What do you want to use as your public directory?”** → `dist`
   - **“Configure as a single-page app (rewrite all urls to /index.html)?”** → **Yes**
   - **“Set up automatic builds and deploys with GitHub?”** → No (unless you want that)
   - **“File dist/index.html already exists. Overwrite?”** → No (keep your build)

4. **If the wrong project is active**  
   From the admin app root:
   ```bash
   firebase use <correct-project-id>
   ```

---

## 4. Configuration check

From the admin app root, confirm:

**`firebase.json`** (already in repo):

- `hosting.site` = `passmartshop-admin` (so deploys go to the admin site only, not the storefront).
- `hosting.public` = `dist`
- `hosting.rewrites`: one rule `source: "**"`, `destination: "/index.html"` (SPA).

**`.firebaserc`** (created by `firebase use`):

- `projects.default` = the Firebase project ID you want for the admin.

---

## 5. Deployment

All commands from the **admin app root**.

1. **Install dependencies (if needed)**  
   ```bash
   npm install
   ```

2. **Build the admin app**  
   ```bash
   npm run build
   ```
   This runs `tsc && vite build` and outputs to `dist/`.

   If `npm` is not in PATH, run the bundler directly from the admin root:
   ```bash
   node node_modules/vite/bin/vite.js build
   ```
   (You may still need `npx tsc --noEmit` or `npm run build` for full type-check + build.)

3. **Deploy only Hosting**  
   ```bash
   firebase deploy --only hosting
   ```

After a successful deploy, the CLI will show the Hosting URL(s), e.g.  
`https://<project-id>.web.app` and/or `https://<project-id>.firebaseapp.com`.

---

## 6. Custom domain for admin (optional)

You can serve the admin at a custom domain (e.g. **admin.passmart.com**) so it’s separate from the default **passmartshop-admin.web.app** URL.

**Important:** Add the domain to the **admin** Hosting site (**passmartshop-admin**), not the default site (which is for the user shop at passmart.com). Use different DNS records than the ones used for passmart.com.

1. **Open Hosting for the admin site**  
   [Firebase Console](https://console.firebase.google.com/project/passmartshop/hosting) → project **passmartshop** → **Hosting**.  
   In the list of sites, open the **passmartshop-admin** site (not the default one).

2. **Add custom domain**  
   On the admin site’s page, click **Add custom domain**.  
   Enter the hostname you want (e.g. `admin.passmart.com`).

3. **Add DNS records at your registrar**  
   Firebase will show the exact values. Add them at the place where you manage DNS for passmart.com (e.g. Cloudflare, GoDaddy, Namecheap).

   **Verification (TXT)**  
   - **Type:** TXT  
   - **Host/Name:** For `admin.passmart.com` use `admin` (or whatever Firebase shows; often just the subdomain, not the full domain).  
   - **Value:** Copy the value from Firebase exactly.  
   - **TTL:** 3600 or your provider’s default.

   **Go live (A records)**  
   - **Type:** A  
   - **Host/Name:** Same as above (e.g. `admin`).  
   - **Value:** The IP address(es) Firebase shows (usually two A records with two IPs).

4. **Verify and wait for SSL**  
   Wait 15–60 minutes for DNS to propagate, then in Firebase click **Verify**. Leave the TXT record in place.  
   After verification, Firebase will provision an SSL certificate. When that’s done, the admin app will be available at your custom domain (e.g. **https://admin.passmart.com**).

---

## Summary

- **Admin app root** = this repo root (`passmartshob_web_admin`).
- **Build output** = `dist`. **SPA** = yes; rewrites are in `firebase.json`.
- **Commands (all from admin app root):**
  - `firebase login`  
  - `firebase use <project-id>`  
  - `npm run build`  
  - `firebase deploy --only hosting`
