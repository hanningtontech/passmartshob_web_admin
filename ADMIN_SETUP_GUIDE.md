# Admin setup guide: add admins in Firebase (login only, no sign-up)

Only emails you add in Firebase can log in. There is **no sign-up page**—just a **login** page. You set each admin’s password when you create the user; they can change it later from the admin panel.

---

## Step 1: Add an admin user in Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/) and select your project (e.g. **passmartshop**).
2. Go to **Build → Authentication**.
3. Open the **Users** tab.
4. Click **Add user**.
5. Enter:
   - **Email:** the admin’s email (e.g. `admin@yourdomain.com`).
   - **Password:** set a temporary password (at least 6 characters). You’ll share this with the admin so they can log in; they can change it later in the app.
6. Click **Add user**.

Repeat for every person who should have admin access.

---

## Step 2: Set the admin role (custom claim)

By default, new users don’t have the `admin` role. You must set it so the app and Firebase rules treat them as admin.

### Option A – Firebase Console (if you use Identity Platform / custom claims UI)

Some projects have a way to set custom claims in the console. If you don’t see it, use Option B.

### Option B – Use the project’s script (recommended)

A ready-to-run script lives in the **`scripts`** folder. Full step-by-step instructions are in **`scripts/README.md`**. Short version:

1. **Install (once):**  
   From the project root:
   ```bash
   cd scripts
   npm install
   ```

2. **Get a service account key (once):**  
   Firebase Console → **Project settings** (gear) → **Service accounts** → **Generate new private key**.  
   Save the downloaded JSON as **`scripts/serviceAccountKey.json`** (do not commit this file).

3. **Get the user’s UID:**  
   Firebase Console → **Authentication** → **Users** → find the user → copy their **User UID**.

4. **Run the script:**  
   From the **`scripts`** folder:
   ```bash
   node set-admin.js PASTE_THE_UID_HERE
   ```
   Example: `node set-admin.js xYz12AbC34dEf56GhI78JkL`

5. The admin must **sign out and sign in again** so their token includes `role: 'admin'`. Then they can use the admin panel and change their password from the sidebar.

---

## Step 3: Tell the admin how to log in and change password

- **Login:** Send them the admin app URL (e.g. `https://admin.yourshop.com`) and the temporary email + password you set in Step 1.
- **Change password:** Once logged in, they click their name area in the sidebar → **Change password**, enter current password and new password.

**Forgot password:** On the login page they can use **Forgot password?** (after entering their email). Firebase will send a reset link to that email—only works for emails you’ve already added in Authentication.

---

## Summary

| You do | Admin does |
|--------|------------|
| Add user in Firebase Auth (email + initial password) | Logs in with that email/password |
| Set `role: 'admin'` via Admin SDK script (one time per user) | Uses the admin panel; can change password in sidebar |
| No sign-up page—only you create accounts | Forgot password? uses the link Firebase emails to them |

This way, only the emails you add in Firebase can log in, and only those you grant `role: 'admin'` can access the dashboard and change data.
