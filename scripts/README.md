# Set admin role script

This folder contains a small Node script that sets the Firebase custom claim `role: 'admin'` for a user. Run it **once per admin** after you add them in Firebase Authentication.

---

## Step 1: Install the dependency

In a terminal, from the **project root** (not inside `scripts`):

```bash
cd scripts
npm install firebase-admin
```

You only need to do this once.

---

## Step 2: Get your Firebase service account key

1. Open [Firebase Console](https://console.firebase.google.com/) and select your project.
2. Click the **gear** next to "Project Overview" → **Project settings**.
3. Open the **Service accounts** tab.
4. Click **Generate new private key** → **Generate key**. A JSON file will download.
5. **Rename** the file to `serviceAccountKey.json`.
6. **Move** it into the `scripts` folder so you have:
   ```
   passmartshob_web_admin/
     scripts/
       serviceAccountKey.json   ← here
       set-admin.js
       package.json
   ```

**Important:** Do not commit `serviceAccountKey.json` to git (it’s already in `.gitignore`). Keep it only on your machine.

---

## Step 3: Get the user’s UID

1. In Firebase Console go to **Build → Authentication → Users**.
2. Find the user you added (the one you want to make admin).
3. Copy their **User UID** (a long string like `xYz12AbC34dEf56GhI78JkL`).

---

## Step 4: Run the script

From the **scripts** folder:

```bash
node set-admin.js PASTE_THE_UID_HERE
```

**Example** (replace with the real UID):

```bash
node set-admin.js xYz12AbC34dEf56GhI78JkL
```

You should see:

```
Done. Admin claim set for UID: xYz12AbC34dEf56GhI78JkL
That user must sign out and sign in again to get the new role.
```

---

## Step 5: User signs in again

The user must **sign out** of the admin app (if they’re logged in) and **sign in again** so their token includes the new `role: 'admin'`. After that, they’ll have full admin access.

---

## Adding more admins later

1. Add the new user in Firebase Console (Authentication → Users → Add user).
2. Copy their **User UID**.
3. From the `scripts` folder run: `node set-admin.js <their-UID>`.
4. Tell them to sign in (or sign out and back in) to the admin app.

You don’t need to download the service account key again; reuse the same `serviceAccountKey.json`.
