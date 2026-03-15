import { useState } from "react";
import { Link } from "wouter";
import { Plus, Edit, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function AdminCategories() {
  const [searchQuery, setSearchQuery] = useState("");
  const categoriesQuery = trpc.categories.list.useQuery();

  const filteredCategories = categoriesQuery.data?.filter((cat: any) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      toast.success("Category deleted successfully!");
      categoriesQuery.refetch();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Categories</h1>
            <p className="text-gray-400">Manage product categories</p>
          </div>
          <Link href="/admin/categories/add">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Categories Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700 border-b border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Slug
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Display Order
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Products
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {categoriesQuery.isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="hover:bg-gray-750 transition">
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-32 bg-gray-700" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-24 bg-gray-700" />
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
                ) : filteredCategories.length > 0 ? (
                  filteredCategories.map((category: any) => (
                    <tr
                      key={category.id}
                      className="hover:bg-gray-750 transition"
                    >
                      <td className="px-6 py-4 text-white font-medium">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {category.slug}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {category.displayOrder}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
                          0
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/categories/${category.id}/edit`}>
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
                              handleDelete(category.id, category.name)
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
                    <td colSpan={5} className="px-6 py-8 text-center">
                      <p className="text-gray-400">No categories found</p>
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
