# Add order to Firestore from the SHOP (storefront)

**Use this in your shop (storefront) project** so that when a customer places an order, it is saved to Firestore and appears in the admin.

The admin reads from **Firestore → collection `orders` → project `passmartshop`**. The shop must write there with the **same** Firebase app it uses for products/categories.

---

## 1. Same Firebase project

In the **shop** app, your Firebase config must use **projectId: "passmartshop"** (same as the admin). For example:

```ts
// e.g. in your shop's firebase.ts or lib/firebase.ts
const firebaseConfig = {
  apiKey: "...",
  authDomain: "passmartshop.firebaseapp.com",
  projectId: "passmartshop",   // MUST be passmartshop
  storageBucket: "passmartshop.firebasestorage.app",
  messagingSenderId: "...",
  appId: "...",
}
```

If the shop uses a different project, orders will go to the wrong place and the admin will not see them.

---

## 2. After checkout succeeds – write to Firestore

Wherever the shop currently saves the order (e.g. after tRPC `orders.create` or your API call), **also** add a Firestore write. Example:

```ts
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'   // your shop's Firestore (same projectId: passmartshop)

// Call this right after the order is placed successfully (e.g. after payment/checkout success)
async function saveOrderToFirestore(order: {
  orderNumber?: string
  paymentMethod: 'M-Pesa' | 'Cash on Delivery'
  paymentStatus: 'pending' | 'awaiting_verification'
  mpesaTransactionCode?: string
  total: number
  currency?: string
  items: Array<{ name: string; quantity: number; price: number; productId?: string }>
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  shippingAddress?: string
}) {
  const ref = await addDoc(collection(db, 'orders'), {
    orderNumber: order.orderNumber ?? undefined,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    mpesaTransactionCode: order.mpesaTransactionCode ?? undefined,
    total: order.total,
    currency: order.currency ?? 'KES',
    items: order.items,
    customerName: order.customerName ?? undefined,
    customerEmail: order.customerEmail ?? undefined,
    customerPhone: order.customerPhone ?? undefined,
    shippingAddress: order.shippingAddress ?? undefined,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}
```

- **M-Pesa:** use `paymentStatus: 'awaiting_verification'` and set `mpesaTransactionCode` from the customer input.
- **Cash on Delivery:** use `paymentStatus: 'pending'`.

---

## 3. Where to call it in the shop

- If checkout is in one place (e.g. `checkout.ts`, `placeOrder()`): right after you get success from your backend/tRPC, call `saveOrderToFirestore({ ... })` with the same order data.
- If you only use tRPC and don’t want to change the shop: then change the **backend** that handles `orders.create` so it also writes to Firestore (same project `passmartshop`, collection `orders`) using the Firebase Admin SDK.

---

## 4. Quick test

1. In the shop, place a test order.
2. Open [Firebase Console](https://console.firebase.google.com) → project **passmartshop** → **Firestore**.
3. Check if a new document appeared in the **orders** collection.
4. In the admin, open **Orders** and click **Refresh**.

If the document appears in Firestore but not in the admin, the admin may be using a different project or the rules may still block read. If no document appears, the shop (or backend) is not writing to this Firestore collection yet.
