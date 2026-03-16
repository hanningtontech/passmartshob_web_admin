# Hosting and admin security

## Do you need to host both the user site and the admin site?

**Yes.** You have two separate apps:

| App | Purpose | Deploy separately |
|-----|--------|--------------------|
| **Shop (user site)** e.g. `passmartshop_web` | Public storefront for customers | One URL, e.g. `https://yourshop.com` |
| **Admin (this app)** `passmartshob_web_admin` | Manage categories, products, orders | Another URL, e.g. `https://admin.yourshop.com` or `https://yourshop.com/admin-app` |

- Same Firebase project (same Firestore and Storage) for both.
- Deploy the shop and the admin as two different sites (e.g. two Vercel/Netlify projects, or shop on main domain and admin on a subdomain).

---

## How do you ensure others can’t create an admin profile and log in?

**They can’t.** Admin access is controlled in two places:

### 1. Only you can make someone an admin (custom claim)

- The app treats a user as admin only if their Firebase ID token has the **custom claim** `role: 'admin'`.
- Custom claims can be set **only** with the **Firebase Admin SDK** (server-side), e.g. in a Cloud Function or a small Node script. They **cannot** be set from the client or by “signing up as admin.”
- So: no one can “create an admin profile” from the website. You (or your backend) explicitly grant admin by setting that claim for specific UIDs.

### 2. How to set the admin role (one-time per admin user)

**Option A – Firebase Cloud Function (recommended for production)**

- In your Firebase project, add a callable function (or an HTTP function protected by a secret) that:
  - Verifies the requester (e.g. you, or an existing admin).
  - Calls Firebase Admin SDK: `admin.auth().setCustomUserClaims(uid, { role: 'admin' })`.
- Call it once per user who should be admin (e.g. your own UID from Firebase Authentication).

**Option B – One-off Node script**

- Use a small Node script that uses the Firebase Admin SDK and a service account:
  - Get the user’s UID (from Firebase Console → Authentication or from your app).
  - Run: `admin.auth().setCustomUserClaims(uid, { role: 'admin' })`.
- Run the script only when you want to promote a user to admin.

After you set `role: 'admin'` for a user, they must **sign out and sign in again** (or refresh the ID token) so the new claim is present in the token.

### 3. What this app does to enforce it

- **RequireAdmin** (and the routes under it) now:
  - Redirect to `/login` if the user is not signed in.
  - If signed in but **without** `role: 'admin'`, show “Access denied” and do not show admin pages.
  - Only users with `role: 'admin'` in their token can see the admin dashboard.
- **Firebase security rules** (Option B in `firebase-rules.md`): Firestore and Storage allow **writes** only when `request.auth.token.role == 'admin'`. So even if someone bypassed the front-end, they still could not create or change data without that claim.

### Summary

- **Hosting:** Host both the user (shop) app and this admin app as two separate deployments.
- **Security:** Only users you promote with the Firebase Admin SDK (custom claim `role: 'admin'`) can access the admin app and write to Firestore/Storage. No one can “create” an admin account from the site.
