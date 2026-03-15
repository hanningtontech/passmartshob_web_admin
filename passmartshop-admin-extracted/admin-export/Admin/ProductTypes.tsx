import { useState } from "react";
import { Link } from "wouter";
import { Plus, Edit, Trash2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "sonner";

export default function AdminProductTypes() {
  const [productTypes, setProductTypes] = useState([
    {
      id: 1,
      name: "Electronics",
      slug: "electronics",
      description: "Electronic devices and gadgets",
      fieldCount: 5,
      active: true,
    },
    {
      id: 2,
      name: "Appliances",
      slug: "appliances",
      description: "Home appliances",
      fieldCount: 3,
      active: true,
    },
  ]);

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Delete product type "${name}"?`)) {
      setProductTypes((prev) => prev.filter((pt) => pt.id !== id));
      toast.success("Product type deleted");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Product Types</h1>
            <p className="text-gray-400">Define product categories with custom fields</p>
          </div>
          <Link href="/admin/product-types/add">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Product Type
            </Button>
          </Link>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700 border-b border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Fields
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {productTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-750 transition">
                    <td className="px-6 py-4 text-white font-medium">{type.name}</td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {type.description}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
                        {type.fieldCount} fields
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {type.active ? (
                        <span className="text-green-400 text-sm">Active</span>
                      ) : (
                        <span className="text-gray-500 text-sm">Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/product-types/${type.id}/fields`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-blue-900 hover:bg-blue-800 border-blue-700 text-blue-300"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/product-types/${type.id}/edit`}>
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
                          onClick={() => handleDelete(type.id, type.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
