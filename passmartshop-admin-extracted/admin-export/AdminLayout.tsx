import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  BarChart3,
  Package,
  Layers,
  LogOut,
  Menu,
  X,
  Settings,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { label: "Dashboard", path: "/admin", icon: BarChart3 },
    { label: "Categories", path: "/admin/categories", icon: Layers },
    { label: "Product Types", path: "/admin/product-types", icon: Package },
    { label: "Products", path: "/admin/products", icon: Package },
    { label: "Import/Export", path: "/admin/import-export", icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gray-800 border-r border-gray-700 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                PS
              </div>
              <span className="font-bold text-lg">passmartshop-admin</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-700 rounded-lg transition"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <a className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-700 transition group">
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <span className="text-sm font-medium group-hover:text-orange-400 transition">
                      {item.label}
                    </span>
                  )}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-700 p-4 space-y-3">
          {sidebarOpen && (
            <div className="px-2">
              <p className="text-xs text-gray-400">Logged in as</p>
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-center gap-2 bg-gray-700 hover:bg-gray-600 border-gray-600"
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && "Logout"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
          <h1 className="text-2xl font-bold">passmartshop-admin</h1>
          <div className="flex items-center gap-4">
            <Link href="/">
              <a className="text-sm text-gray-400 hover:text-orange-400 transition">
                View Store
              </a>
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-gray-900">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
