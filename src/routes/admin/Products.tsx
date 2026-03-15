import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import AdminLayout from '@/components/AdminLayout'
import { toast } from 'sonner'
import { db, collection, isFirebaseConfigured } from '@/firebase'
import { getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore'

type Product = {
  id: string
  name: string
  categoryId: string
  basePrice?: number
  price?: number
  inStock: boolean
  featured: boolean
  images?: string[]
}

type Category = { id: string; name: string }

export default function AdminProducts() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const loadCategories = () => {
    if (!isFirebaseConfigured) return
    getDocs(query(collection(db, 'categories'), orderBy('displayOrder', 'asc')))
      .then((snap) =>
        setCategories(snap.docs.map((d) => ({ id: d.id, name: (d.data().name as string) ?? d.id })))
      )
      .catch(() => setCategories([]))
  }

  const loadProducts = () => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }
    setLoading(true)
    getDocs(query(collection(db, 'products')))
      .then((snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Product, 'id'>),
        }))
        list.sort((a, b) => {
          const at = (a as Product & { createdAt?: { toMillis?: () => number } }).createdAt?.toMillis?.() ?? 0
          const bt = (b as Product & { createdAt?: { toMillis?: () => number } }).createdAt?.toMillis?.() ?? 0
          return bt - at
        })
        setProducts(list)
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCategories()
    loadProducts()
  }, [])

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCat = !categoryFilter || p.categoryId === categoryFilter
    return matchSearch && matchCat
  })

  const getCategoryName = (catId: string) =>
    categories.find((c) => c.id === catId)?.name ?? catId

  const handleDelete = async (productId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return
    if (!isFirebaseConfigured) return
    try {
      await deleteDoc(doc(db, 'products', productId))
      toast.success('Product deleted successfully!')
      loadProducts()
    } catch {
      toast.error('Failed to delete product')
    }
  }

  const price = (p: Product) => p.basePrice ?? p.price ?? 0

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Products</h1>
            <p className="text-gray-400">Manage your product inventory</p>
          </div>
          <Link to="/admin/products/add">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700 border-b border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Product Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Stock</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Featured</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="hover:bg-gray-700/80 transition">
                      <td className="px-6 py-4"><Skeleton className="h-4 w-40 bg-gray-700" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24 bg-gray-700" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-16 bg-gray-700" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-12 bg-gray-700" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-12 bg-gray-700" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20 bg-gray-700" /></td>
                    </tr>
                  ))
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-700/80 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-700 rounded" />
                          )}
                          <span className="text-white font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{getCategoryName(product.categoryId)}</td>
                      <td className="px-6 py-4 text-white font-medium">${Number(price(product)).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${product.inStock ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {product.featured ? <span className="text-orange-400 font-medium">★</span> : <span className="text-gray-500">-</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/product/${product.id}`} title="View on store">
                            <Button size="sm" variant="outline" className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link to={`/admin/products/${product.id}/edit`}>
                            <Button size="sm" variant="outline" className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button size="sm" variant="outline" className="bg-red-900/30 hover:bg-red-800/40 border-red-600 text-red-400" onClick={() => void handleDelete(product.id, product.name)}>
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
  )
}
