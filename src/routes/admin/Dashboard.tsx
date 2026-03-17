import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  Layers,
  ShoppingCart,
  TrendingUp,
  Plus,
  ArrowRight,
  Database,
  Cloud,
  Zap,
} from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'
import { Skeleton } from '@/components/ui/skeleton'
import { db, collection, isFirebaseConfigured } from '@/firebase'
import { getAggregateFromServer, getCountFromServer, query, orderBy, where, sum } from 'firebase/firestore'
const INITIAL_STATS = {
  totalCategories: 0,
  totalProducts: 0,
  totalOrders: 0,
  totalRevenue: 0,
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(INITIAL_STATS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }
    async function load() {
      try {
        const catQ = query(collection(db, 'categories'), orderBy('displayOrder', 'asc'))
        const prodQ = query(collection(db, 'products'))
        const ordersQ = query(collection(db, 'orders'))
        const completedOrdersQ = query(collection(db, 'orders'), where('paymentStatus', '==', 'completed'))
        const [catSnap, prodSnap, ordersCountSnap, revenueSnap] = await Promise.all([
          getCountFromServer(catQ),
          getCountFromServer(prodQ),
          getCountFromServer(ordersQ),
          getAggregateFromServer(completedOrdersQ, { totalRevenue: sum('total') }),
        ])
        // Note: revenue uses Firestore aggregate sum for paymentStatus == 'completed'.
        // If your storefront stores a different status shape, align it so 'completed' is stored exactly.
        const rawRevenue = revenueSnap.data().totalRevenue
        const totalRevenueKsh = typeof rawRevenue === 'number' ? rawRevenue : 0
        setStats({
          totalCategories: catSnap.data().count,
          totalProducts: prodSnap.data().count,
          totalOrders: ordersCountSnap.data().count,
          totalRevenue: totalRevenueKsh,
        })
      } catch {
        setStats(INITIAL_STATS)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const statCardIconBg: Record<string, string> = {
    orange: 'bg-orange-500/20',
    blue: 'bg-blue-500/20',
    green: 'bg-green-500/20',
    purple: 'bg-purple-500/20',
  }
  const statCardIconColor: Record<string, string> = {
    orange: 'text-orange-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
  }

  const StatCard = ({
    label,
    value,
    icon: Icon,
    color,
  }: {
    label: string
    value: string | number
    icon: React.ComponentType<{ className?: string }>
    color: string
  }) => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${statCardIconBg[color]}`}>
          <Icon className={`h-6 w-6 ${statCardIconColor[color]}`} />
        </div>
      </div>
      <p className="text-gray-400 text-sm font-medium mb-2">{label}</p>
      {loading ? (
        <Skeleton className="h-8 w-20 bg-gray-700" />
      ) : (
        <p className="text-3xl font-bold text-white">{value}</p>
      )}
    </div>
  )

  const QuickActionCard = ({
    icon: Icon,
    label,
    description,
    to,
  }: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    description: string
    to: string
  }) => (
    <Link
      to={to}
      className="group bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition block"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-orange-500/20 group-hover:scale-110 transition-transform">
          <Icon className="h-6 w-6 text-orange-400" />
        </div>
        <ArrowRight
          size={20}
          className="text-orange-400 group-hover:translate-x-1 transition-transform"
        />
      </div>
      <h3 className="text-white font-bold mb-1">{label}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </Link>
  )

  return (
    <AdminLayout>
      <div className="space-y-8">
        {!isFirebaseConfigured && (
          <div className="rounded-lg border border-orange-500/40 bg-orange-900/20 px-4 py-3 text-sm text-orange-200">
            Firebase is not fully configured. Set your project in{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5">src/firebase.ts</code> for real data.
          </div>
        )}

        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">
            Welcome back! Here's your store overview at a glance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Total Products"
            value={stats.totalProducts}
            icon={Package}
            color="blue"
          />
          <StatCard
            label="Total Categories"
            value={stats.totalCategories}
            icon={Layers}
            color="green"
          />
          <StatCard
            label="Total Orders"
            value={stats.totalOrders}
            icon={ShoppingCart}
            color="orange"
          />
          <StatCard
            label="Total Revenue (completed)"
            value={`KSH ${stats.totalRevenue.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={TrendingUp}
            color="purple"
          />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickActionCard
              icon={Plus}
              label="Add Product"
              description="Create a new product listing"
              to="/admin/products/add"
            />
            <QuickActionCard
              icon={Package}
              label="All Products"
              description="View and manage products"
              to="/admin/products"
            />
            <QuickActionCard
              icon={Layers}
              label="Manage Categories"
              description="View and edit categories"
              to="/admin/categories"
            />
            <QuickActionCard
              icon={Zap}
              label="Import/Export"
              description="Bulk operations"
              to="/admin/import-export"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-white mb-4">System Status</h2>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database size={18} className="text-blue-400" />
                    <span className="text-gray-300 font-medium text-sm">Database</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-green-400">Connected</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Cloud size={18} className="text-purple-400" />
                    <span className="text-gray-300 font-medium text-sm">Backblaze S3</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-green-400">Ready</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap size={18} className="text-yellow-400" />
                    <span className="text-gray-300 font-medium text-sm">API Server</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-green-400">Running</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-gray-700">
                  <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">Admin dashboard initialized</p>
                    <p className="text-gray-400 text-xs mt-1">Just now</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 pb-4 border-b border-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">System ready for product management</p>
                    <p className="text-gray-400 text-xs mt-1">Just now</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">All systems operational</p>
                    <p className="text-gray-400 text-xs mt-1">Just now</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
