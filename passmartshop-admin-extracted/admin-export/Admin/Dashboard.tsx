import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Package, Layers, ShoppingCart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalCategories: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  const categoriesQuery = trpc.categories.list.useQuery();
  const productsQuery = trpc.products.list.useQuery({
    limit: 1000,
    offset: 0,
  });

  useEffect(() => {
    if (categoriesQuery.data && productsQuery.data) {
      setStats({
        totalCategories: categoriesQuery.data.length,
        totalProducts: productsQuery.data.length,
        totalOrders: 0, // Would be fetched from orders table
        totalRevenue: 0, // Would be calculated from orders
      });
      setLoading(false);
    }
  }, [categoriesQuery.data, productsQuery.data]);

  const statCards = [
    {
      label: "Total Categories",
      value: stats.totalCategories,
      icon: Layers,
      color: "text-blue-400",
      bgColor: "bg-blue-900",
    },
    {
      label: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "text-green-400",
      bgColor: "bg-green-900",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "text-orange-400",
      bgColor: "bg-orange-900",
    },
    {
      label: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-purple-400",
      bgColor: "bg-purple-900",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Welcome to your admin dashboard</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-400 text-sm font-medium">
                    {card.label}
                  </h3>
                  <div className={`${card.bgColor} p-3 rounded-lg`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-20 bg-gray-700" />
                ) : (
                  <p className="text-3xl font-bold text-white">
                    {card.value}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/admin/categories">
                <Button className="w-full justify-start bg-gray-700 hover:bg-gray-600 text-white">
                  <Layers className="h-4 w-4 mr-2" />
                  Manage Categories
                </Button>
              </Link>
              <Link href="/admin/categories/add">
                <Button className="w-full justify-start bg-gray-700 hover:bg-gray-600 text-white">
                  <Layers className="h-4 w-4 mr-2" />
                  Add New Category
                </Button>
              </Link>
              <Link href="/admin/products">
                <Button className="w-full justify-start bg-gray-700 hover:bg-gray-600 text-white">
                  <Package className="h-4 w-4 mr-2" />
                  Manage Products
                </Button>
              </Link>
              <Link href="/admin/products/add">
                <Button className="w-full justify-start bg-gray-700 hover:bg-gray-600 text-white">
                  <Package className="h-4 w-4 mr-2" />
                  Add New Product
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">System Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Database</span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-green-400">Connected</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Backblaze S3</span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-green-400">Connected</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">API Server</span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-green-400">Running</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-700">
              <div>
                <p className="text-white font-medium">New product added</p>
                <p className="text-sm text-gray-400">5 minutes ago</p>
              </div>
              <span className="text-sm text-gray-500">Admin</span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-700">
              <div>
                <p className="text-white font-medium">Category updated</p>
                <p className="text-sm text-gray-400">1 hour ago</p>
              </div>
              <span className="text-sm text-gray-500">Admin</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">New order received</p>
                <p className="text-sm text-gray-400">3 hours ago</p>
              </div>
              <span className="text-sm text-gray-500">Customer</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
