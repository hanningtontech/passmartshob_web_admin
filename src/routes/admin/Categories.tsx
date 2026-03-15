import { useEffect, useState, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, FolderPlus, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import AdminLayout from '@/components/AdminLayout'
import { toast } from 'sonner'
import { db, collection, isFirebaseConfigured } from '@/firebase'
import { getDocs, orderBy, query, deleteDoc, doc, setDoc } from 'firebase/firestore'
import { serverTimestamp } from '@/firebase'
import { DEFAULT_ROOT_CATEGORIES } from '@/lib/defaultCategories'

export type Category = {
  id: string
  name: string
  slug: string
  displayOrder: number
  active?: boolean
  parentId?: string | null
  description?: string
}

function buildCategoryTree(flat: Category[]): { category: Category; children: ReturnType<typeof buildCategoryTree>; depth: number }[] {
  const byParent = new Map<string | null, Category[]>()
  byParent.set(null, [])
  flat.forEach((c) => {
    const pid = c.parentId ?? null
    if (!byParent.has(pid)) byParent.set(pid, [])
    byParent.get(pid)!.push(c)
  })
  const sort = (arr: Category[]) => arr.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
  function build(parentId: string | null, depth: number): { category: Category; children: ReturnType<typeof build>; depth: number }[] {
    const list = byParent.get(parentId) ?? []
    sort(list)
    return list.map((category) => ({
      category,
      depth,
      children: build(category.id, depth + 1),
    }))
  }
  return build(null, 0)
}

function slugFromName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function AdminCategories() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [expandingParentId, setExpandingParentId] = useState<string | null>(null)
  const [newSubName, setNewSubName] = useState('')
  const [adding, setAdding] = useState(false)
  /** Set of category IDs that are expanded to show their children */
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  /** Product count per category ID (direct assignment only; excludes children) */
  const [productCountByCategoryId, setProductCountByCategoryId] = useState<Record<string, number>>({})

  const load = () => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }
    setLoading(true)
    const categoriesQuery = query(collection(db, 'categories'), orderBy('displayOrder', 'asc'))
    getDocs(categoriesQuery)
      .then((catSnap) => {
        setCategories(
          catSnap.docs.map((d) => {
            const data = d.data() as Omit<Category, 'id'>
            return { id: d.id, parentId: data.parentId ?? null, ...data }
          })
        )
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))
    getDocs(collection(db, 'products'))
      .then((prodSnap) => {
        const counts: Record<string, number> = {}
        prodSnap.docs.forEach((d) => {
          const categoryId = (d.data() as { categoryId?: string }).categoryId
          if (categoryId) {
            counts[categoryId] = (counts[categoryId] ?? 0) + 1
          }
        })
        setProductCountByCategoryId(counts)
      })
      .catch(() => setProductCountByCategoryId({}))
  }

  useEffect(() => {
    load()
  }, [])

  const handleSeedDefaults = async () => {
    if (!isFirebaseConfigured) return
    setSeeding(true)
    try {
      const snap = await getDocs(collection(db, 'categories'))
      const existingIds = new Set(snap.docs.map((d) => d.id))
      let added = 0
      for (const { name, slug, displayOrder } of DEFAULT_ROOT_CATEGORIES) {
        if (existingIds.has(slug)) continue
        await setDoc(doc(db, 'categories', slug), {
          name,
          slug,
          displayOrder,
          parentId: null,
          active: true,
          description: '',
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        })
        existingIds.add(slug)
        added++
      }
      if (added > 0) {
        toast.success(`Added ${added} default categories.`)
        load()
      } else {
        toast.info('Default categories already exist.')
      }
    } catch {
      toast.error('Failed to seed categories')
    } finally {
      setSeeding(false)
    }
  }

  const tree = buildCategoryTree(categories)
  const flattenForFilter = (nodes: typeof tree): { category: Category; depth: number }[] => {
    const out: { category: Category; depth: number }[] = []
    function walk(n: typeof tree) {
      n.forEach(({ category, depth, children }) => {
        out.push({ category, depth })
        walk(children)
      })
    }
    walk(nodes)
    return out
  }
  const filtered = searchQuery.trim()
    ? flattenForFilter(tree).filter(({ category }) =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : flattenForFilter(tree)

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return
    if (!isFirebaseConfigured) return
    try {
      await deleteDoc(doc(db, 'categories', id))
      toast.success('Category deleted successfully!')
      load()
    } catch {
      toast.error('Failed to delete category')
    }
  }

  const handleAddSubcategory = async (parentId: string) => {
    const name = newSubName.trim()
    if (!name || !isFirebaseConfigured) return
    setAdding(true)
    try {
      const slug = slugFromName(name) || crypto.randomUUID().slice(0, 8)
      const id = `${parentId}-${slug}-${Date.now()}`.slice(0, 150)
      await setDoc(doc(db, 'categories', id), {
        name,
        slug,
        parentId,
        displayOrder: 0,
        active: true,
        description: '',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      })
      toast.success(`Subcategory "${name}" added`)
      setExpandingParentId(null)
      setNewSubName('')
      load()
    } catch {
      toast.error('Failed to add subcategory')
    } finally {
      setAdding(false)
    }
  }

  const openSubcategoryForm = (parentId: string) => {
    setExpandingParentId((prev) => (prev === parentId ? null : parentId))
    setNewSubName('')
  }

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  type TreeRow = { category: Category; children: ReturnType<typeof buildCategoryTree>; depth: number }
  const renderTreeRows = (nodes: TreeRow[]): React.ReactNode =>
    nodes.map(({ category, children, depth }) => {
      const hasChildren = children.length > 0
      const isExpanded = expandedIds.has(category.id)
      const isFormOpen = expandingParentId === category.id
      return (
        <Fragment key={category.id}>
          <tr className="hover:bg-gray-700/80 transition">
            <td className="px-6 py-4 text-white font-medium" style={{ paddingLeft: `${16 + depth * 20}px` }}>
              <span className="inline-flex items-center gap-1">
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => toggleExpanded(category.id)}
                    className="p-0.5 rounded hover:bg-gray-600 text-gray-400 hover:text-white"
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                ) : (
                  <span className="w-5 inline-block" />
                )}
                {depth > 0 && <span className="text-gray-500">↳</span>}
                {category.name}
              </span>
            </td>
            <td className="px-6 py-4 text-gray-400">{category.slug}</td>
            <td className="px-6 py-4 text-gray-400">{category.displayOrder}</td>
            <td className="px-6 py-4 text-gray-400">
              <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">{productCountByCategoryId[category.id] ?? 0}</span>
            </td>
            <td className="px-6 py-4 text-right">
              <div className="flex justify-end gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300"
                  title="Add subcategory"
                  onClick={() => openSubcategoryForm(category.id)}
                >
                  <FolderPlus className="h-4 w-4 mr-1" />
                  Add subcategory
                </Button>
                <Link to={`/admin/categories/${category.id}/edit`}>
                  <Button size="sm" variant="outline" className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                <Button size="sm" variant="outline" className="bg-red-900/30 hover:bg-red-800/40 border-red-600 text-red-400" onClick={() => void handleDelete(category.id, category.name)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </td>
          </tr>
          {isFormOpen && (
            <tr className="bg-gray-700/50">
              <td colSpan={5} className="px-6 py-4" style={{ paddingLeft: `${36 + depth * 20}px` }}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-gray-400 text-sm">New subcategory under &quot;{category.name}&quot;</span>
                  <input
                    type="text"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    placeholder="Subcategory name"
                    className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubcategory(category.id))}
                  />
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => handleAddSubcategory(category.id)} disabled={adding || !newSubName.trim()}>
                    {adding ? 'Adding...' : 'Add'}
                  </Button>
                  <Button size="sm" variant="outline" className="border-gray-600 text-gray-400" onClick={() => { setExpandingParentId(null); setNewSubName('') }}>
                    Cancel
                  </Button>
                </div>
              </td>
            </tr>
          )}
          {hasChildren && isExpanded && renderTreeRows(children)}
        </Fragment>
      )
    })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Categories</h1>
            <p className="text-gray-400">Manage product categories and subcategories</p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
              onClick={() => void handleSeedDefaults()}
              disabled={seeding || !isFirebaseConfigured}
            >
              {seeding ? 'Seeding...' : 'Seed default categories'}
            </Button>
            <Link to="/admin/categories/add">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add main category
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700 border-b border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Slug</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Display Order</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Products</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="hover:bg-gray-700/80 transition">
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32 bg-gray-700" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24 bg-gray-700" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-12 bg-gray-700" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-12 bg-gray-700" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20 bg-gray-700" /></td>
                    </tr>
                  ))
                ) : filtered.length > 0 ? (
                  <>
                    <tr className="border-b border-gray-600 bg-gray-800/80">
                      <td colSpan={5} className="px-6 py-3">
                        <Link to="/admin/categories/add" className="text-orange-400 hover:text-orange-300 text-sm font-medium inline-flex items-center gap-1">
                          <Plus className="h-4 w-4" />
                          Add new main category
                        </Link>
                      </td>
                    </tr>
                    {searchQuery.trim() ? (
                      filtered.map(({ category, depth }) => (
                        <Fragment key={category.id}>
                          <tr className="hover:bg-gray-700/80 transition">
                            <td className="px-6 py-4 text-white font-medium" style={{ paddingLeft: `${16 + depth * 20}px` }}>
                              {depth > 0 && <span className="text-gray-500 mr-2">↳</span>}
                              {category.name}
                            </td>
                            <td className="px-6 py-4 text-gray-400">{category.slug}</td>
                            <td className="px-6 py-4 text-gray-400">{category.displayOrder}</td>
                            <td className="px-6 py-4 text-gray-400">
                              <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">{productCountByCategoryId[category.id] ?? 0}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2 flex-wrap">
                                <Button size="sm" variant="outline" className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300" title="Add subcategory" onClick={() => openSubcategoryForm(category.id)}>
                                  <FolderPlus className="h-4 w-4 mr-1" />
                                  Add subcategory
                                </Button>
                                <Link to={`/admin/categories/${category.id}/edit`}>
                                  <Button size="sm" variant="outline" className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300"><Edit className="h-4 w-4" /></Button>
                                </Link>
                                <Button size="sm" variant="outline" className="bg-red-900/30 hover:bg-red-800/40 border-red-600 text-red-400" onClick={() => void handleDelete(category.id, category.name)}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </td>
                          </tr>
                          {expandingParentId === category.id && (
                            <tr className="bg-gray-700/50">
                              <td colSpan={5} className="px-6 py-4" style={{ paddingLeft: `${36 + depth * 20}px` }}>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-gray-400 text-sm">New subcategory under &quot;{category.name}&quot;</span>
                                  <input type="text" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} placeholder="Subcategory name" className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-orange-500" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubcategory(category.id))} />
                                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => handleAddSubcategory(category.id)} disabled={adding || !newSubName.trim()}>{adding ? 'Adding...' : 'Add'}</Button>
                                  <Button size="sm" variant="outline" className="border-gray-600 text-gray-400" onClick={() => { setExpandingParentId(null); setNewSubName('') }}>Cancel</Button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))
                    ) : (
                      renderTreeRows(tree)
                    )}
                  </>
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center">
                      <p className="text-gray-400">No categories found. Click &quot;Seed default categories&quot; to add the main categories.</p>
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
