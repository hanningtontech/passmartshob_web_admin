import { useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Layers,
  Settings,
  Package,
  FileUp,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ShoppingBag,
  KeyRound,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import ChangePasswordModal from './ChangePasswordModal'

interface AdminLayoutProps {
  children: ReactNode
}

const menuItems = [
  { label: 'Dashboard', path: '/admin', icon: BarChart3 },
  { label: 'Categories', path: '/admin/categories', icon: Layers },
  { label: 'Product Types', path: '/admin/product-types', icon: Settings },
  { label: 'Products', path: '/admin/products', icon: Package },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { label: 'Import/Export', path: '/admin/import-export', icon: FileUp },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const auth = useAuth()
  const user = auth.status === 'admin' || auth.status === 'not-admin' ? auth.user : null

  const handleLogout = async () => {
    await auth.logout()
    navigate('/')
  }

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path))

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 flex flex-col
          bg-gray-800 border-r border-gray-700
          transition-all duration-300
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarOpen ? 'w-64 lg:w-64' : 'lg:w-20 w-64'}`}
      >
        <div className="h-20 flex items-center justify-between px-4 border-b border-gray-700 shrink-0">
          {sidebarOpen && (
            <Link to="/admin" className="flex items-center gap-3 min-w-0">
              <img
                src="/admin-icon.png"
                alt="Passmartshop Admin"
                className="w-10 h-10 rounded-lg shrink-0 object-contain bg-orange-500/10"
              />
              <div className="min-w-0">
                <h1 className="text-white font-bold text-sm">Passmartshop</h1>
                <p className="text-xs text-gray-400">Admin Panel</p>
              </div>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors lg:block hidden text-gray-400"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 hover:bg-gray-700 rounded lg:hidden text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 border-l-4 ${
                  active
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500'
                    : 'border-transparent text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 font-medium text-sm">{item.label}</span>
                    {active && <ChevronRight size={16} className="text-orange-400" />}
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-gray-700 p-4 space-y-3 shrink-0">
          {sidebarOpen && user && (
            <div className="px-2 py-2 space-y-2">
              <p className="text-xs text-gray-400">Logged in as</p>
              <p className="text-sm font-medium text-white truncate">
                {user.name || user.email || 'Admin'}
              </p>
              <button
                type="button"
                onClick={() => setChangePasswordOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors text-left"
              >
                <KeyRound size={18} />
                <span className="text-sm font-medium">Change password</span>
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors ${
              !sidebarOpen && 'justify-center'
            }`}
          >
            <LogOut size={18} />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
        {changePasswordOpen && user?.email && (
          <ChangePasswordModal
            userEmail={user.email}
            onClose={() => setChangePasswordOpen(false)}
          />
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6 lg:px-8 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-700 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-white">passmartshop-admin</h2>
            <p className="text-xs text-gray-400 mt-1">Manage your store efficiently</p>
          </div>
          <a
            href="https://passmartshop.com/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors shrink-0 font-medium text-sm"
          >
            View Store
            <ChevronRight size={16} />
          </a>
        </header>

        <main className="flex-1 overflow-auto bg-gray-900">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
