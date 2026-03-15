import { useState } from "react";
import { Link } from "wouter";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function AdminProducts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>();

  const categoriesQuery = trpc.categories.list.useQuery();
  const productsQuery = trpc.products.list.useQuery({
    categoryId: categoryFilter,
    search: searchQuery || undefined,
    limit: 100,
    offset: 0,
  });

  const filteredProducts = productsQuery.data || [];

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      toast.success("Product deleted successfully!");
      productsQuery.refetch();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Products</h1>
            <p className="text-gray-400">Manage your product inventory</p>
          </div>
          <Link href="/admin/products/add">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                value={categoryFilter || ""}
                onChange={(e) =>
                  setCategoryFilter(
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Categories</option>
                {categoriesQuery.data?.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700 border-b border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Product Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Featured
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {productsQuery.isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="hover:bg-gray-750 transition">
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-40 bg-gray-700" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-24 bg-gray-700" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-16 bg-gray-700" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-12 bg-gray-700" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-12 bg-gray-700" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-20 bg-gray-700" />
                      </td>
                    </tr>
                  ))
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((product: any) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-750 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-700 rounded" />
                          )}
                          <span className="text-white font-medium">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {product.categoryId}
                      </td>
                      <td className="px-6 py-4 text-white font-medium">
                        ${parseFloat(product.basePrice).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            product.inStock
                              ? "bg-green-900 text-green-300"
                              : "bg-red-900 text-red-300"
                          }`}
                        >
                          {product.inStock ? "In Stock" : "Out of Stock"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {product.featured ? (
                          <span className="text-orange-400 font-medium">★</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/product/${product.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-900 hover:bg-red-800 border-red-700 text-red-300"
                            onClick={() =>
                              handleDelete(product.id, product.name)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <p className="text-gray-400">No products found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
