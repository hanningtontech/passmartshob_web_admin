import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AdminLayout from '@/components/AdminLayout'
import { toast } from 'sonner'
import { db, doc, serverTimestamp, isFirebaseConfigured } from '@/firebase'
import { getDoc, updateDoc } from 'firebase/firestore'
import type { FirestoreOrder, OrderPaymentStatus } from '@/types/order'
import { PAYMENT_STATUS_LABEL, normalizePaymentStatus } from '@/types/order'

function paymentStatusBadge(status: OrderPaymentStatus) {
  const base = 'px-2 py-1 rounded-full text-xs font-medium'
  const label = PAYMENT_STATUS_LABEL[status] ?? status
  switch (status) {
    case 'awaiting_verification':
      return <span className={`${base} bg-amber-500/20 text-amber-400 border border-amber-500/40`}>{label}</span>
    case 'completed':
      return <span className={`${base} bg-green-500/20 text-green-400 border border-green-500/40`}>{label}</span>
    case 'failed':
      return <span className={`${base} bg-red-500/20 text-red-400 border border-red-500/40`}>{label}</span>
    case 'refunded':
      return <span className={`${base} bg-gray-500/20 text-gray-400 border border-gray-500/40`}>{label}</span>
    default:
      return <span className={`${base} bg-gray-600/30 text-gray-300 border border-gray-500/40`}>{label}</span>
  }
}

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState<(FirestoreOrder & { id: string }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [mpesaAdminId, setMpesaAdminId] = useState('')

  const loadOrder = () => {
    if (!id || !isFirebaseConfigured) {
      setLoading(false)
      return
    }
    setLoading(true)
    getDoc(doc(db, 'orders', id))
      .then((snap) => {
        if (snap.exists()) {
          const d = snap.data() as Omit<FirestoreOrder, 'id'>
          setOrder({
            id: snap.id,
            ...d,
            paymentStatus: normalizePaymentStatus(d.paymentStatus),
          } as FirestoreOrder & { id: string })
        } else {
          setOrder(null)
        }
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadOrder()
  }, [id])

  const updatePaymentStatus = async (
    newStatus: OrderPaymentStatus,
    mpesaAdminTransactionId?: string
  ) => {
    if (!id || !isFirebaseConfigured) return
    setUpdating(true)
    try {
      const payload: Record<string, unknown> = {
        paymentStatus: newStatus,
        updatedAt: serverTimestamp(),
      }
      if (mpesaAdminTransactionId !== undefined && mpesaAdminTransactionId !== '') {
        payload.mpesaAdminTransactionId = mpesaAdminTransactionId
      }
      await updateDoc(doc(db, 'orders', id), payload)
      toast.success('Payment status updated')
      setVerifyDialogOpen(false)
      setMpesaAdminId('')
      loadOrder()
    } catch {
      toast.error('Failed to update payment status')
    } finally {
      setUpdating(false)
    }
  }

  const handleVerifyMpesa = () => {
    setVerifyDialogOpen(true)
  }

  const handleConfirmVerify = () => {
    updatePaymentStatus('completed', mpesaAdminId.trim() || undefined)
  }

  const handleMarkFailed = () => {
    if (!confirm('Mark this payment as failed?')) return
    updatePaymentStatus('failed')
  }

  const handleCodPaid = () => {
    if (!confirm('Mark this order as paid on delivery?')) return
    updatePaymentStatus('completed')
  }

  const handleCodNotPaid = () => {
    if (!confirm('Mark as not paid (payment failed)?')) return
    updatePaymentStatus('failed')
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-gray-400">Loading order...</div>
      </AdminLayout>
    )
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <p className="text-gray-400">Order not found.</p>
          <Link to="/admin/orders">
            <Button variant="outline" className="border-gray-600 text-gray-300">Back to Orders</Button>
          </Link>
        </div>
      </AdminLayout>
    )
  }

  const isMpesaAwaiting = order.paymentMethod === 'M-Pesa' && order.paymentStatus === 'awaiting_verification'
  const isCod = order.paymentMethod === 'Cash on Delivery'
  const currency = order.currency ?? 'KES'
  const total = typeof order.total === 'number' ? order.total : 0

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/admin/orders">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800/50">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Order {order.orderNumber ?? order.id?.slice(0, 8) ?? id}
            </h1>
            <p className="text-gray-400 mt-1">Payment and order details</p>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
          <h2 className="text-lg font-semibold text-white">Payment Details</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500">Payment method</dt>
              <dd className="text-white font-medium mt-0.5">
                {order.paymentMethod === 'M-Pesa' ? 'M-Pesa' : 'Cash on Delivery'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Payment status</dt>
              <dd className="mt-0.5">{paymentStatusBadge(order.paymentStatus)}</dd>
            </div>
            {order.paymentMethod === 'M-Pesa' && order.mpesaTransactionCode && (
              <div>
                <dt className="text-sm text-gray-500">M-Pesa transaction code (from customer)</dt>
                <dd className="text-white font-mono mt-0.5">{order.mpesaTransactionCode}</dd>
              </div>
            )}
            {order.mpesaAdminTransactionId && (
              <div>
                <dt className="text-sm text-gray-500">M-Pesa transaction ID (verified by admin)</dt>
                <dd className="text-white font-mono mt-0.5">{order.mpesaAdminTransactionId}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-gray-500">Total amount due</dt>
              <dd className="text-white font-semibold mt-0.5">{currency} {total.toFixed(2)}</dd>
            </div>
          </dl>

          {/* M-Pesa verification controls */}
          {isMpesaAwaiting && (
            <div className="pt-4 border-t border-gray-700 space-y-3">
              <p className="text-sm text-amber-400">This M-Pesa payment is awaiting verification.</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleVerifyMpesa}
                  disabled={updating}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Verify M-Pesa Payment
                </Button>
                <Button
                  onClick={handleMarkFailed}
                  disabled={updating}
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-500/10"
                >
                  Mark Payment Failed
                </Button>
              </div>
            </div>
          )}

          {/* Cash on Delivery controls */}
          {isCod && (order.paymentStatus === 'pending' || order.paymentStatus === 'awaiting_verification' || order.paymentStatus === 'completed' || order.paymentStatus === 'failed') && (
            <div className="pt-4 border-t border-gray-700 space-y-3">
              <p className="text-sm text-gray-400">Cash on Delivery — update when payment is collected or failed.</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleCodPaid}
                  disabled={updating}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Mark as Paid on Delivery
                </Button>
                <Button
                  onClick={handleCodNotPaid}
                  disabled={updating}
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-500/10"
                >
                  Mark as Not Paid
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Verify M-Pesa dialog */}
        {verifyDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" aria-modal="true">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-2">Verify M-Pesa Payment</h3>
              <p className="text-gray-400 text-sm mb-4">
                Are you sure you have verified this M-Pesa payment? You can optionally enter the M-Pesa transaction ID below.
              </p>
              <input
                type="text"
                value={mpesaAdminId}
                onChange={(e) => setMpesaAdminId(e.target.value)}
                placeholder="M-Pesa transaction ID (optional)"
                className="admin-input mb-4"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setVerifyDialogOpen(false); setMpesaAdminId('') }} className="border-gray-600 text-gray-300">
                  Cancel
                </Button>
                <Button onClick={handleConfirmVerify} disabled={updating} className="bg-orange-600 hover:bg-orange-700 text-white">
                  {updating ? 'Updating...' : 'Confirm verification'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Customer & items */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
          <h2 className="text-lg font-semibold text-white">Customer & delivery</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {order.customerName && (
              <div><dt className="text-gray-500">Name</dt><dd className="text-white">{order.customerName}</dd></div>
            )}
            {order.customerEmail && (
              <div><dt className="text-gray-500">Email</dt><dd className="text-white">{order.customerEmail}</dd></div>
            )}
            {order.customerPhone && (
              <div><dt className="text-gray-500">Phone</dt><dd className="text-white">{order.customerPhone}</dd></div>
            )}
            {order.shippingAddress && (
              <div className="md:col-span-2"><dt className="text-gray-500">Shipping address</dt><dd className="text-white">{order.shippingAddress}</dd></div>
            )}
          </dl>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
          <h2 className="text-lg font-semibold text-white">Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-600 text-gray-400">
                <tr>
                  <th className="text-left py-2 pr-4">Product</th>
                  <th className="text-right py-2 px-2">Qty</th>
                  <th className="text-right py-2 pl-2">Price</th>
                </tr>
              </thead>
              <tbody className="text-gray-300 divide-y divide-gray-700">
                {(order.items ?? []).map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 pr-4">{item.name ?? (item as unknown as Record<string, unknown>).productName ?? '—'}</td>
                    <td className="text-right py-2 px-2">{item.quantity}</td>
                    <td className="text-right py-2 pl-2">{currency} {(item.price ?? 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
