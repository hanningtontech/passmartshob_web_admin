# Connect this admin app to Firebase and link it to your shop

Use **one Firebase project** for both:
- This **admin app** (passmartshob_web_admin) – manage categories and products
- Your **shop frontend** (passmartshop_web) – read categories and products for customers

Same project = same Firestore and Storage, so what you edit in the admin appears in the shop.

---

## 1. Create or use a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. **Create a project** (or pick an existing one). Remember the **Project ID**.
3. In the project, go to **Build → Firestore Database** and **Create database** (start in test mode for now; lock it down with rules later).
4. Go to **Build → Storage** and **Get started** (use default rules for now).
5. Go to **Build → Authentication** and **Get started**, then enable **Email/Password** (for admin login later).

---

## 2. Get the web app config

1. In Firebase Console, click the **gear (Project settings)**.
2. Under **Your apps**, click **</> (Web)** (or add a web app if you don’t have one).
3. Register the app with a nickname, e.g. `passmart-admin` (you can add another app for the shop with a different nickname).
4. Copy the **firebaseConfig** object. It looks like:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
};
```

---

## 3. Put the config in this admin app

**Option A – Direct in code (quick)**

1. Open **`src/firebase.ts`** in this project.
2. Replace the placeholder `firebaseConfig` with your real object:

```ts
const firebaseConfig = {
  apiKey: "AIza...",           // your values
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
}
```

3. Save. The admin will start using Firestore and Storage; counts and lists will load.

**Option B – Environment variables (better for not committing keys)**

1. In the project root create **`.env`** (and add `.env` to `.gitignore` if it’s not there):

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
```

2. In **`src/firebase.ts`**, use:

```ts
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}
```

3. Restart the dev server (`npm run dev`).

---

## 4. Link the same Firebase to your shop (passmartshop_web)

Your shop and admin share data by using the **same Firebase project**.

1. In the **passmartshop_web** project, find where Firebase is initialized (e.g. `firebase.ts`, `config/firebase.js`, or similar).
2. Use the **same** `firebaseConfig` (same `projectId`, `apiKey`, etc.) as in the admin app.
   - You can use a second web app in the same Firebase project (Project settings → Your apps → Add app → Web) and copy that config into the shop if you want separate app IDs, but **projectId must be the same**.
3. In the shop, **read** from:
   - **Firestore** `categories` and `products` (same collections the admin writes to).
   - **Storage** image URLs that are stored in `products.images`.

No need to enable Auth in the shop for customers unless you want signed-in users; the admin is the only one writing.

---

## 5. Data layout (so admin and shop stay in sync)

- **Firestore**
  - `categories` – each doc: `name`, `slug`, `description`, `displayOrder`, `active`, `tree` (nested nodes), `createdAt`, `updatedAt`.
  - `products` – each doc: `name`, `description`, `categoryId`, `price`, `compareAtPrice`, `featured`, `isNew`, `inStock`, `rating`, `images[]`, `attributes{}`, `createdAt`, `updatedAt`.
- **Storage**
  - Product images: e.g. `products/{productId}/{filename}`. The admin uploads here and saves the download URLs in `product.images`.

The shop should query `categories` and `products` (and use `product.images`) as you already designed; the admin just fills that data.

---

## 6. (Optional) Turn admin auth back on

When you want only logged-in admins to use this app:

1. In Firebase Console → Authentication, create a user (Email/Password) for yourself.
2. Set an admin role:
   - **Option A – Custom claims:** Use the Firebase Admin SDK (e.g. in a small Cloud Function or script) to set `role: 'admin'` on that user’s token.
   - **Option B – Firestore:** Create a doc `users/{uid}` with `role: 'admin'` and in the admin app check that doc instead of claims.
3. In **`src/components/RequireAdmin.tsx`**, restore the previous logic that uses `useAuth()`, checks for admin, and redirects to `/login` when not authenticated.
4. Re-add the **Login** route in **`App.tsx`** (render `<Login />` on `/login` instead of redirecting to `/`).

---

## Quick checklist

| Step | Admin app (this repo) | Shop app (passmartshop_web) |
|------|----------------------|-----------------------------|
| Firebase project | Same project | Same project |
| Config | Put in `src/firebase.ts` (or `.env`) | Put in its firebase config file |
| Firestore | Read/write `categories`, `products` | Read `categories`, `products` |
| Storage | Upload product images | Read image URLs from `products.images` |
| Auth | Optional: Email/Password + admin check | Optional: only if you need customer login |

Once both use the same `projectId` (and same config), they are linked: edits in the admin show up in the shop.
