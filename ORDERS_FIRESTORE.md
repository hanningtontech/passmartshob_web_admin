# Orders in Firestore – Why the admin shows (or doesn’t show) orders

The admin panel loads orders from **Firestore**, in the same Firebase project it uses for categories and products.

---

## Where the admin reads from

- **Collection:** `orders`
- **Project:** same as admin Firebase config (e.g. `passmartshop` in `src/firebase.ts`)

If the **storefront** (shop) saves orders somewhere else (e.g. only via tRPC to MySQL), those orders **will not appear** in this admin. The admin does not call a tRPC API for orders; it only uses Firestore.

---

## What the storefront must do for orders to appear here

When a customer completes checkout, the storefront (or your backend) must **create a document in the Firestore `orders` collection** in the **same Firebase project** the admin uses.

### Option A – Storefront writes directly to Firestore

After checkout succeeds, call Firestore from the storefront, for example:

```ts
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'  // same project as admin (e.g. passmartshop)

const orderRef = await addDoc(collection(db, 'orders'), {
  orderNumber: 'ORD-12345',        // optional
  paymentMethod: 'M-Pesa',        // or 'Cash on Delivery'
  paymentStatus: 'awaiting_verification',  // or 'pending' for CoD
  mpesaTransactionCode: 'ABC123', // when M-Pesa; optional
  total: 15999,
  currency: 'KES',
  items: [
    { name: 'Product A', quantity: 1, price: 15999, productId: '...' },
  ],
  customerName: 'Jane Doe',
  customerEmail: 'jane@example.com',
  customerPhone: '+254...',
  shippingAddress: '...',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
})
```

Use the **same** `db` / Firebase app as the one used for categories and products (same `projectId` as the admin).

### Option B – Backend (tRPC/Node) also writes to Firestore

If the storefront sends orders to your backend (e.g. tRPC `orders.create`), that backend should **also** write each order to Firestore so the admin can see it:

1. Receive the order from the storefront (e.g. tRPC mutation).
2. Save to your MySQL/DB as you do now.
3. **In addition**, write the same order to Firestore `orders` (same project as admin), e.g. using the Firebase Admin SDK or a Firestore client with the same project ID.

That way the admin (which only reads Firestore) will show the new orders.

---

## Document shape (Firestore `orders`)

Each document in `orders` should have at least:

| Field | Type | Required |
|-------|------|----------|
| `paymentMethod` | `'M-Pesa'` or `'Cash on Delivery'` | Yes |
| `paymentStatus` | `'pending'` \| `'awaiting_verification'` \| `'completed'` \| `'failed'` \| `'refunded'` | Yes |
| `total` | number | Yes |
| `items` | array of `{ name, quantity, price }` | Yes |
| `createdAt` | Firestore Timestamp (or serverTimestamp()) | Recommended |

Optional but used by the admin: `orderNumber`, `mpesaTransactionCode`, `currency`, `customerName`, `customerEmail`, `customerPhone`, `shippingAddress`, `updatedAt`.

---

## Firestore security rules

Ensure your Firestore rules allow:

- **Storefront (or backend):** write (create) to `orders` when a customer places an order.
- **Admin:** read (and optionally write for status updates) to `orders` for authenticated admin users.

If the admin cannot read `orders`, you will see an error on the Orders page and in the browser console.

---

## Quick check

1. In [Firebase Console](https://console.firebase.google.com) → your project (e.g. passmartshop) → Firestore.
2. Open the **orders** collection.
3. After placing an order in the shop, check if a new document appears there.

- If **yes** but the admin still shows “No orders”: check that the admin app is using the same Firebase project (same `projectId` in `src/firebase.ts`).
- If **no** new document: the storefront (or backend) is not writing to this Firestore collection; add a write to `orders` as above so the admin can show orders.
