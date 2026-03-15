# Firebase Security Rules

Paste these in **Firebase Console** → your project.

---

## Firestore rules

**Path:** Firestore Database → **Rules** tab

### Option A – Development (admin works without login)

Use this while auth is still off so the admin can read/write without signing in.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Categories and products: allow read/write for now (no auth required)
    match /categories/{id} {
      allow read, write: if true;
    }
    match /products/{id} {
      allow read, write: if true;
    }
    // Orders: storefront can create; admin can read/update (dev: allow all)
    match /orders/{id} {
      allow read, write: if true;
    }
    // Block everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Option B – Production (admin-only writes, public read)

Use this when you turn auth back on and set the `admin` custom claim on your user.  
Everyone (including your shop) can **read** `categories` and `products`. Only signed-in admins can **write**.  
**Orders:** storefront (or backend) can **create**; only signed-in admins can **read** and **update** (e.g. payment status).

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /categories/{id} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    match /products/{id} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    match /orders/{id} {
      allow create: if true;
      allow read, update: if request.auth != null && request.auth.token.role == 'admin';
      allow delete: if false;
    }
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Publish:** Click **Publish** after pasting.

---

## Storage rules

**Path:** Storage → **Rules** tab

Use this so the admin can upload product images; your shop only needs to read the URLs (no Storage read rule needed for public URLs).

### Option A – Development (no auth)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} {
      allow read, write: if true;
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### Option B – Production (admin-only write, public read)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

**Publish:** Click **Publish** after pasting.

---

## When to use which

| Situation | Firestore | Storage |
|----------|-----------|---------|
| Auth still off, testing admin | Option A | Option A |
| Auth on, admin claim set, shop live | Option B | Option B |

After you set the `role: 'admin'` custom claim on your user and re-enable login in the admin app, switch both to **Option B**.
