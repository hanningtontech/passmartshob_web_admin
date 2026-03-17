import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Settings, Tags } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AdminLayout from '@/components/AdminLayout'
import { toast } from 'sonner'
import { db, collection, isFirebaseConfigured } from '@/firebase'
import { getDocs, query, where, orderBy } from 'firebase/firestore'

type ProductType = {
  id: string
  name: string
  slug: string
  description: string
  fieldCount: number
  active: boolean
}

export default function AdminProductTypes() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 30

  const load = () => {
    if (!isFirebaseConfigured) {
      setProductTypes([])
      setLoading(false)
      return
    }
    setLoading(true)
    // Collection name assumption: 'productTypes'
    // Documents should include: name, slug, description, fieldCount, active
    const q = query(
      collection(db, 'productTypes'),
      where('active', '==', true),
      orderBy('name', 'asc')
    )
    getDocs(q)
      .then((snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ProductType, 'id'>),
        }))
        setProductTypes(list)
        setPage(1)
      })
      .catch(() => setProductTypes([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const totalPages = Math.max(1, Math.ceil(productTypes.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const pagedTypes = useMemo(() => productTypes.slice(start, start + PAGE_SIZE), [productTypes, start])

  const handleDelete = (typeId: string, name: string) => {
    if (confirm(`Delete product type "${name}"?`)) {
      setProductTypes((prev) => prev.filter((pt) => pt.id !== typeId))
      toast.success('Product type deleted')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Product Types</h1>
            <p className="mt-1 text-gray-400">Define product categories with custom fields</p>
          </div>
          <Link to="/admin/product-types/add">
            <Button className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white">
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Description</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Fields</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {pagedTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-700/80 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-white">{type.name}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{type.description}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                        {type.fieldCount} fields
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {type.active ? (
                        <span className="text-green-400 text-sm font-medium">Active</span>
                      ) : (
                        <span className="text-gray-500 text-sm">Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/admin/product-types/${type.id}/fields`}>
                          <Button size="sm" variant="outline" className="bg-gray-700 hover:bg-slate-600 border-slate-600 text-gray-300">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link to={`/admin/product-types/${type.id}/edit`}>
                          <Button size="sm" variant="outline" className="bg-gray-700 hover:bg-slate-600 border-slate-600 text-gray-300">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-red-900/30 hover:bg-red-800/40 border-red-600 text-red-400"
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

        {productTypes.length === 0 && (
          <div className="bg-gray-800 rounded-lg p-16 border border-gray-700 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-gray-700 p-4">
                <Tags className="h-10 w-10 text-gray-500" />
              </div>
              <div>
                <p className="font-medium text-gray-300">No product types yet</p>
                <p className="text-sm text-gray-500 mt-1">Create a product type to define custom fields</p>
              </div>
              <Link to="/admin/product-types/add">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Product Type
                </Button>
              </Link>
            </div>
          </div>
        )}

        {!loading && productTypes.length > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              Showing <span className="text-gray-300 font-medium">{start + 1}</span>–
              <span className="text-gray-300 font-medium">{Math.min(start + PAGE_SIZE, productTypes.length)}</span> of{' '}
              <span className="text-gray-300 font-medium">{productTypes.length}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800" onClick={() => setPage(1)} disabled={safePage === 1}>
                First
              </Button>
              <Button type="button" variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
                Prev
              </Button>
              <span className="text-xs text-gray-400 px-2">
                Page <span className="text-gray-200 font-medium">{safePage}</span> / <span className="text-gray-200 font-medium">{totalPages}</span>
              </span>
              <Button type="button" variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
                Next
              </Button>
              <Button type="button" variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800" onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>
                Last
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
