import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AdminLayout from '@/components/AdminLayout'
import { toast } from 'sonner'
import { db, doc, serverTimestamp, isFirebaseConfigured } from '@/firebase'
import { getDoc, setDoc, updateDoc } from 'firebase/firestore'

export default function AdminCategoryForm() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isEdit = !!id && id !== 'add'
  const categoryId = id
  const parentIdFromQuery = searchParams.get('parentId') || undefined

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    displayOrder: 0,
    active: true,
    parentId: null as string | null,
  })
  const [parentName, setParentName] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isEdit && parentIdFromQuery && isFirebaseConfigured) {
      getDoc(doc(db, 'categories', parentIdFromQuery))
        .then((snap) => setParentName(snap.exists() ? (snap.data()?.name as string) ?? null : null))
        .catch(() => setParentName(null))
    }
  }, [parentIdFromQuery, isEdit])

  useEffect(() => {
    if (!isEdit || !isFirebaseConfigured || !categoryId) return
    setLoading(true)
    getDoc(doc(db, 'categories', categoryId))
      .then((snap) => {
        if (snap.exists()) {
          const d = snap.data() as Record<string, unknown>
          setFormData({
            name: (d.name as string) ?? '',
            slug: (d.slug as string) ?? '',
            description: (d.description as string) ?? '',
            displayOrder: (d.displayOrder as number) ?? 0,
            active: (d.active as boolean) ?? true,
            parentId: (d.parentId as string | null) ?? null,
          })
        }
      })
      .finally(() => setLoading(false))
  }, [isEdit, categoryId])

  useEffect(() => {
    if (!isEdit && parentIdFromQuery) {
      setFormData((prev) => ({ ...prev, parentId: parentIdFromQuery }))
    }
  }, [isEdit, parentIdFromQuery])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
            ? parseInt(value, 10) || 0
            : value,
    }))
  }

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData((prev) => ({ ...prev, name, slug: generateSlug(name) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFirebaseConfigured) {
      toast.error('Firebase is not configured')
      return
    }
    setIsSubmitting(true)
    try {
      const isSubcategory = !isEdit && (formData.parentId || parentIdFromQuery)
      const docId = isEdit
        ? categoryId!
        : isSubcategory
          ? crypto.randomUUID()
          : (formData.slug || crypto.randomUUID())
      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        displayOrder: formData.displayOrder,
        active: formData.active,
        parentId: formData.parentId ?? null,
        updatedAt: serverTimestamp(),
      }
      const ref = doc(db, 'categories', docId)
      if (isEdit) {
        await updateDoc(ref, payload)
        toast.success('Category updated successfully!')
      } else {
        await setDoc(ref, { ...payload, createdAt: serverTimestamp() })
        toast.success(isSubcategory ? 'Subcategory added!' : 'Category created successfully!')
      }
      navigate('/admin/categories')
    } catch {
      toast.error('Failed to save category')
    } finally {
      setIsSubmitting(false)
    }
  }

  const labelClass = 'block text-sm font-semibold text-gray-300 mb-2'

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-gray-400">Loading...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/categories')}
            className="text-gray-400 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {isEdit ? 'Edit Category' : parentIdFromQuery ? 'Add Subcategory' : 'Add Category'}
            </h1>
            <p className="text-gray-400">
              {isEdit
                ? 'Update category information'
                : parentIdFromQuery
                  ? parentName
                    ? `Under: ${parentName} (subcategories can have their own subcategories)`
                    : 'Subcategory under selected parent'
                  : 'Create a new root category'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
            {parentIdFromQuery && (
              <p className="text-sm text-orange-400 bg-orange-900/20 border border-orange-700 rounded-lg px-4 py-2">
                This will be added as a subcategory. You can add further subcategories under it later from the category list.
              </p>
            )}
            <div>
              <label className={labelClass}>Category Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleNameChange}
                required
                className="admin-input"
                placeholder="e.g., Home & Kitchen"
              />
            </div>
            <div>
              <label className={labelClass}>Slug *</label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
                className="admin-input"
                placeholder="e.g., home-appliances"
              />
              <p className="text-xs text-gray-500 mt-1">Auto-generated from name. Used in URLs.</p>
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="admin-input"
                placeholder="Category description..."
              />
            </div>
            <div>
              <label className={labelClass}>Display Order</label>
              <input
                type="number"
                name="displayOrder"
                value={formData.displayOrder}
                onChange={handleChange}
                className="admin-input"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first in navigation.</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-500 bg-slate-700 cursor-pointer accent-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-0"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-300 cursor-pointer">
                Active
              </label>
              <p className="text-xs text-gray-500">Inactive categories won't appear in the store</p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/categories')}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isFirebaseConfigured}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
