import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Eye, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import AdminLayout from '@/components/AdminLayout'
import { toast } from 'sonner'
import { db, collection, isFirebaseConfigured } from '@/firebase'
import { getDocs } from 'firebase/firestore'
import type { FirestoreOrder, OrderPaymentStatus, OrderPaymentMethod } from '@/types/order'
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

function paymentMethodBadge(method: OrderPaymentMethod) {
  const base = 'px-2 py-1 rounded-full text-xs font-medium'
  if (method === 'M-Pesa') return <span className={`${base} bg-orange-500/20 text-orange-400 border border-orange-500/40`}>M-Pesa</span>
  return <span className={`${base} bg-blue-500/20 text-blue-400 border border-blue-500/40`}>Cash on Delivery</span>
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<(FirestoreOrder & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadOrders = () => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      setLoadError('Firebase is not configured.')
      return
    }
    setLoading(true)
    setLoadError(null)
    getDocs(collection(db, 'orders'))
      .then((snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<FirestoreOrder, 'id'>),
        }))
        list.sort((a, b) => {
          const at = (a.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0
          const bt = (b.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0
          return bt - at
        })
        setOrders(list)
      })
      .catch((err) => {
        console.error('Failed to load orders:', err)
        setOrders([])
        const message = err?.message ?? String(err)
        setLoadError(message)
        toast.error('Could not load orders. See console for details.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadOrders()
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800/50">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-white tracking-tight">Orders</h1>
            <p className="text-gray-400 mt-1">Manage M-Pesa and Cash on Delivery orders</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadOrders} disabled={loading} className="border-gray-600 text-gray-300 hover:bg-gray-700 shrink-0">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loadError && (
          <div className="rounded-lg border border-amber-600/50 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm">
            <strong>Could not load orders.</strong> {loadError}
            <p className="mt-2 text-amber-200/80">
              This admin reads from Firestore collection <code className="bg-black/20 px-1 rounded">orders</code> (project: passmartshop). If the shop saves orders to a different place (e.g. tRPC/MySQL), they will not appear here. See <code className="bg-black/20 px-1 rounded">ORDERS_FIRESTORE.md</code> in this project.
            </p>
          </div>
        )}

        {!loading && !loadError && orders.length === 0 && (
          <div className="rounded-lg border border-orange-500/50 bg-orange-500/10 px-4 py-4 text-orange-200 text-sm">
            <strong className="block mb-2">Why are no orders showing?</strong>
            <p className="mb-2">This admin only shows orders that are saved in <strong>Firestore</strong>, collection <code className="bg-black/20 px-1 rounded">orders</code>, project <code className="bg-black/20 px-1 rounded">passmartshop</code>.</p>
            <p className="mb-2 font-medium">Checklist:</p>
            <ol className="list-decimal list-inside space-y-1 text-orange-200/90">
              <li>Open Firebase Console → project <strong>passmartshop</strong> → Firestore. Do you see an <strong>orders</strong> collection with documents?</li>
              <li>If <strong>no</strong>: the shop is not writing orders to Firestore. In the <strong>shop (storefront)</strong> project, after checkout succeeds you must call <code className="bg-black/20 px-1 rounded">{'addDoc(collection(db, \'orders\'), orderData)'}</code> with the same Firebase project. See <strong>STOREFRONT_ADD_ORDER_TO_FIRESTORE.md</strong> in this repo for copy-paste code.</li>
              <li>If <strong>yes</strong> but admin still empty: ensure the shop uses the same Firebase config (same <code className="bg-black/20 px-1 rounded">projectId: "passmartshop"</code>).</li>
            </ol>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700 border-b border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Order</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Total</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Payment method</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Payment status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24 bg-gray-700" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32 bg-gray-700" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-16 bg-gray-700" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20 bg-gray-700" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-28 bg-gray-700" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20 bg-gray-700" /></td>
                    </tr>
                  ))
                ) : orders.length > 0 ? (
                  orders.map((order) => {
                    const status = normalizePaymentStatus(order.paymentStatus)
                    const needsAttention = order.paymentMethod === 'M-Pesa' && status === 'awaiting_verification'
                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-gray-700/80 transition ${needsAttention ? 'bg-amber-500/5 border-l-4 border-l-amber-500' : ''}`}
                      >
                        <td className="px-6 py-4 text-white font-medium">
                          {order.orderNumber ?? order.id?.slice(0, 8) ?? '—'}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {order.customerName ?? order.customerEmail ?? order.customerPhone ?? '—'}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {order.currency ?? 'KES'} {typeof order.total === 'number' ? order.total.toFixed(2) : order.total ?? '—'}
                        </td>
                        <td className="px-6 py-4">{paymentMethodBadge(order.paymentMethod)}</td>
                        <td className="px-6 py-4">{paymentStatusBadge(status)}</td>
                        <td className="px-6 py-4 text-right">
                          <Link to={`/admin/orders/${order.id}`}>
                            <Button size="sm" variant="outline" className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <p className="text-gray-400">No orders yet.</p>
                      <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
                        This admin reads from Firestore <strong>orders</strong> (project: passmartshop). The storefront must write each new order to that collection for it to appear here. See <code className="bg-gray-700 px-1 rounded">ORDERS_FIRESTORE.md</code>.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
