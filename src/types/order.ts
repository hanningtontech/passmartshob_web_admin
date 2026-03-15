/** Payment method for the order (storefront-submitted). */
export type OrderPaymentMethod = 'M-Pesa' | 'Cash on Delivery'

/**
 * Payment status as stored in Firestore (aligns with storefront / ADMIN_UPDATE_GUIDE §10).
 * Storefront sends: pending (CoD), awaiting_verification (M-Pesa); admin sets completed | failed | refunded.
 */
export type OrderPaymentStatus =
  | 'pending'
  | 'awaiting_verification'
  | 'completed'
  | 'failed'
  | 'refunded'

/** Human-readable label for payment status (for admin UI only). */
export const PAYMENT_STATUS_LABEL: Record<OrderPaymentStatus, string> = {
  pending: 'Pending',
  awaiting_verification: 'Awaiting Verification',
  completed: 'Completed',
  failed: 'Failed',
  refunded: 'Refunded',
}

/**
 * Normalize paymentStatus from Firestore (storefront may use snake_case; legacy may use PascalCase).
 */
export function normalizePaymentStatus(
  value: unknown
): OrderPaymentStatus {
  const s = typeof value === 'string' ? value : ''
  const lower = s.toLowerCase().replace(/\s+/g, '_')
  if (lower === 'pending' || lower === 'awaiting_verification' || lower === 'completed' || lower === 'failed' || lower === 'refunded') {
    return lower as OrderPaymentStatus
  }
  if (s === 'Pending') return 'pending'
  if (s === 'Awaiting Verification') return 'awaiting_verification'
  if (s === 'Confirmed' || s === 'Paid on Delivery') return 'completed'
  if (s === 'Failed') return 'failed'
  if (s === 'Refunded') return 'refunded'
  return 'pending'
}

export interface OrderItem {
  productId?: string
  name: string
  quantity: number
  price: number
  image?: string
}

/** Order document as stored in Firestore (admin + storefront). */
export interface FirestoreOrder {
  id?: string
  /** Customer-facing order ID or number */
  orderNumber?: string
  /** pending | awaiting_verification | completed | failed | refunded (see ADMIN_UPDATE_GUIDE §10) */
  paymentStatus: OrderPaymentStatus
  paymentMethod: OrderPaymentMethod
  /** M-Pesa code submitted by customer */
  mpesaTransactionCode?: string
  /** M-Pesa transaction ID recorded by admin after verification */
  mpesaAdminTransactionId?: string
  /** Total amount due (e.g. for display and verification) */
  total: number
  currency?: string
  items: OrderItem[]
  /** Customer contact for M-Pesa / delivery */
  customerPhone?: string
  customerEmail?: string
  customerName?: string
  shippingAddress?: string
  createdAt?: { toMillis: () => number } | unknown
  updatedAt?: { toMillis: () => number } | unknown
  [key: string]: unknown
}
