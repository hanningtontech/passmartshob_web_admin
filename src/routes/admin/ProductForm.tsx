import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AdminLayout from '@/components/AdminLayout'
import { toast } from 'sonner'
import { db, collection, doc, serverTimestamp, storage, isFirebaseConfigured } from '@/firebase'
import { getDoc, getDocs, addDoc, updateDoc, query, orderBy } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { isB2Configured, uploadFileToB2 } from '@/lib/b2Upload'
import ReactMarkdown from 'react-markdown'

const PRODUCT_DRAFT_KEY = 'passmartshop_product_draft'

type ProductDraft = {
  formData: {
    name: string
    description: string
    shortDescription: string
    categoryId: string
    basePrice: string
    originalPrice: string
    stockCount: string
    isNew: boolean
    featured: boolean
    inStock: boolean
    localStock: boolean
    images: string[]
    tags: string[]
    flashSale: boolean
    flashSalePrice: string
    flashSaleStartsAt: string
    flashSaleEndsAt: string
    rating: string
    reviewCount: string
    soldCount: string
    specifications: { key: string; value: string }[]
    reviews: ProductReview[]
  }
  subProducts: SubProduct[]
  newSubProduct: SubProduct
  savedAt: string
}

function hasDraftContent(d: ProductDraft): boolean {
  const { formData, subProducts } = d
  return !!(
    formData.name.trim() ||
    formData.description.trim() ||
    formData.shortDescription?.trim() ||
    formData.categoryId ||
    formData.basePrice?.trim() ||
    (formData.images?.length ?? 0) > 0 ||
    (formData.tags?.length ?? 0) > 0 ||
    (formData.specifications?.length ?? 0) > 0 ||
    (formData.reviews?.length ?? 0) > 0 ||
    subProducts.length > 0
  )
}

function loadDraft(): ProductDraft | null {
  try {
    const raw = localStorage.getItem(PRODUCT_DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ProductDraft
    if (!parsed?.formData || !parsed?.savedAt) return null
    return parsed
  } catch {
    return null
  }
}

function saveDraft(d: ProductDraft): void {
  if (!hasDraftContent(d)) return
  try {
    localStorage.setItem(PRODUCT_DRAFT_KEY, JSON.stringify({ ...d, savedAt: new Date().toISOString() }))
  } catch {
    // ignore quota / private mode
  }
}

function clearDraft(): void {
  try {
    localStorage.removeItem(PRODUCT_DRAFT_KEY)
  } catch {
    // ignore
  }
}

/**
 * Parse a markdown-style table into key-value specs.
 * Rows like "| Feature | Details |" or "| Product Type | Portable Car Wash |"
 * Header row (Feature / Details) and separator row (|---|---|) are skipped; data rows become { key, value }.
 */
function parseSpecTable(text: string): { key: string; value: string }[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const result: { key: string; value: string }[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.includes('|')) continue
    const cells = line.split('|').map((c) => c.trim()).filter((c) => c.length > 0)
    if (cells.length < 2) continue
    const key = cells[0].trim()
    const value = cells.slice(1).join(' | ').trim()
    if (!key && !value) continue
    if (/^[-:\s]+$/.test(key) && /^[-:\s]+$/.test(value)) continue
    if (key.toLowerCase() === 'feature' && value.toLowerCase() === 'details') continue
    result.push({ key, value })
  }
  return result
}

/** Format Firestore Timestamp or ISO string for datetime-local input (YYYY-MM-DDTHH:mm). */
function formatDateTimeForInput(value: unknown): string {
  if (value == null || value === '') return ''
  if (typeof value === 'string') {
    try {
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) return ''
      return d.toISOString().slice(0, 16)
    } catch {
      return ''
    }
  }
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    const d = (value as { toDate: () => Date }).toDate()
    return d.toISOString().slice(0, 16)
  }
  return ''
}

export interface SubProduct {
  id: string
  name: string
  sku: string
  price: string
  stockCount: string
  /** Per-variant images. When user selects this variant on the storefront, show these images. */
  images?: string[]
  /** Optional Markdown description for this variant (specs, notes). Shown when variant is selected. */
  description?: string
}

export interface ProductReview {
  author: string
  rating: number
  comment: string
  date: string
}

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id && id !== 'add'

  const [allCategories, setAllCategories] = useState<{ id: string; name: string; parentId: string | null }[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    categoryId: '',
    basePrice: '',
    originalPrice: '',
    stockCount: '',
    isNew: true,
    featured: false,
    inStock: true,
    localStock: true,
    images: [] as string[],
    tags: [] as string[],
    flashSale: false,
    flashSalePrice: '' as string,
    flashSaleStartsAt: '' as string,
    flashSaleEndsAt: '' as string,
    rating: '' as string,
    reviewCount: '' as string,
    soldCount: '' as string,
    specifications: [] as { key: string; value: string }[],
    reviews: [] as ProductReview[],
  })
  const [subProducts, setSubProducts] = useState<SubProduct[]>([])
  const [newSubProduct, setNewSubProduct] = useState<SubProduct>({
    id: '',
    name: '',
    sku: '',
    price: '',
    stockCount: '',
    images: [],
    description: '',
  })
  /** Which variant is expanded for editing images/description (variant id or null). */
  const [expandedVariantId, setExpandedVariantId] = useState<string | null>(null)
  /** Pending file uploads per variant id (for the expanded variant only). */
  const [pendingVariantFiles, setPendingVariantFiles] = useState<File[]>([])
  /** URL input for adding variant image (for expanded variant). */
  const [variantImageUrl, setVariantImageUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  /** When true, current form was restored from draft (show banner + discard option). */
  const [isDraftRestored, setIsDraftRestored] = useState(false)
  /** Pasted markdown table text for parsing into specifications. */
  const [specTablePaste, setSpecTablePaste] = useState('')

  /** Keep latest form state for draft save on leave (add page only). */
  const draftStateRef = useRef<ProductDraft | null>(null)
  draftStateRef.current = isEdit
    ? null
    : {
        formData,
        subProducts,
        newSubProduct,
        savedAt: '',
      }

  const MAX_IMAGES = 10
  const MAX_VARIANT_IMAGES = 6
  const totalImageCount = formData.images.length + pendingFiles.length
  const canAddMore = totalImageCount < MAX_IMAGES

  const expandedVariant = expandedVariantId ? subProducts.find((sp) => sp.id === expandedVariantId) : null
  const variantImageCount = expandedVariant ? (expandedVariant.images?.length ?? 0) + pendingVariantFiles.length : 0
  const canAddMoreVariantImages = variantImageCount < MAX_VARIANT_IMAGES

  const [pendingPreviewUrls, setPendingPreviewUrls] = useState<string[]>([])
  const pendingUrlsRef = useRef<string[]>([])
  const [pendingVariantPreviewUrls, setPendingVariantPreviewUrls] = useState<string[]>([])
  const pendingVariantUrlsRef = useRef<string[]>([])
  useEffect(() => {
    pendingUrlsRef.current.forEach((u) => URL.revokeObjectURL(u))
    const urls = pendingFiles.map((f) => URL.createObjectURL(f))
    pendingUrlsRef.current = urls
    setPendingPreviewUrls(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [pendingFiles])
  useEffect(() => {
    pendingVariantUrlsRef.current.forEach((u) => URL.revokeObjectURL(u))
    const urls = pendingVariantFiles.map((f) => URL.createObjectURL(f))
    pendingVariantUrlsRef.current = urls
    setPendingVariantPreviewUrls(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [pendingVariantFiles])

  useEffect(() => {
    if (!isFirebaseConfigured) return
    getDocs(query(collection(db, 'categories'), orderBy('displayOrder', 'asc')))
      .then((snap) => {
        const all = snap.docs.map((d) => {
          const data = d.data()
          return { id: d.id, name: (data.name as string) ?? d.id, parentId: (data.parentId as string | null) ?? null }
        })
        setAllCategories(all)
      })
      .catch(() => setAllCategories([]))
  }, [])

  const rootCategories = allCategories.filter((c) => c.parentId == null)

  /** Path from root to current category: [rootId, childId?, grandchildId?, ...] */
  const getPathFromRoot = (categoryId: string): string[] => {
    if (!categoryId) return []
    const cat = allCategories.find((c) => c.id === categoryId)
    if (!cat) return []
    if (cat.parentId == null) return [cat.id]
    return [...getPathFromRoot(cat.parentId), cat.id]
  }

  const categoryPath = getPathFromRoot(formData.categoryId)

  const getChildrenOf = (parentId: string | null) =>
    allCategories.filter((c) => (c.parentId ?? null) === parentId)

  const handleCategoryLevelChange = (_levelIndex: number, value: string) => {
    setFormData((prev) => ({ ...prev, categoryId: value || '' }))
  }

  /** Restore draft when opening Add Product page. */
  useEffect(() => {
    if (isEdit) return
    const d = loadDraft()
    if (!d) return
    setFormData(d.formData)
    setSubProducts(d.subProducts)
    setNewSubProduct(d.newSubProduct)
    setIsDraftRestored(true)
    toast.success('Draft restored. You can continue editing.')
  }, [isEdit])

  /** Save draft when leaving Add Product page (navigate or close tab). */
  useEffect(() => {
    if (isEdit) return
    const handleBeforeUnload = () => {
      const state = draftStateRef.current
      if (state && hasDraftContent({ ...state, savedAt: '' })) {
        saveDraft({ ...state, savedAt: new Date().toISOString() })
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      const state = draftStateRef.current
      if (state && hasDraftContent({ ...state, savedAt: '' })) {
        saveDraft({ ...state, savedAt: new Date().toISOString() })
      }
    }
  }, [isEdit])

  useEffect(() => {
    if (!isEdit || !id || !isFirebaseConfigured) return
    setLoading(true)
    getDoc(doc(db, 'products', id))
      .then((snap) => {
        if (snap.exists()) {
          const d = snap.data() as Record<string, unknown>
          const specs = d.specifications as Record<string, string> | undefined
          const specEntries = specs && typeof specs === 'object'
            ? Object.entries(specs).map(([key, value]) => ({ key, value }))
            : []
          const revs = d.reviews as ProductReview[] | undefined
          setFormData({
            name: (d.name as string) ?? '',
            description: (d.description as string) ?? '',
            shortDescription: (d.shortDescription as string) ?? '',
            categoryId: (d.categoryId as string) ?? '',
            basePrice: String((d.basePrice ?? d.price ?? 0) as number),
            originalPrice: String((d.originalPrice ?? d.compareAtPrice ?? '') as number | string),
            stockCount: String((d.stockCount ?? '') as number | string),
            isNew: (d.isNew as boolean) ?? true,
            featured: (d.featured as boolean) ?? false,
            inStock: (d.inStock as boolean) ?? true,
            localStock: (d.localStock as boolean) ?? true,
            images: (d.images as string[]) ?? [],
            tags: (d.tags as string[]) ?? [],
            flashSale: (d.flashSale as boolean) ?? false,
            flashSalePrice: d.flashSalePrice != null ? String(d.flashSalePrice as number) : '',
            flashSaleStartsAt: formatDateTimeForInput(d.flashSaleStartsAt),
            flashSaleEndsAt: formatDateTimeForInput(d.flashSaleEndsAt),
            rating: d.rating != null ? String(d.rating as number) : '',
            reviewCount: d.reviewCount != null ? String(d.reviewCount as number) : '',
            soldCount: d.soldCount != null ? String(d.soldCount as number) : '',
            specifications: specEntries,
            reviews: Array.isArray(revs) ? revs.map((r) => ({ author: r.author ?? '', rating: Number(r.rating) ?? 0, comment: r.comment ?? '', date: r.date ?? '' })) : [],
          })
          const raw = (d.subProducts as SubProduct[] | undefined) ?? []
            setSubProducts(raw.map((sp) => ({
              ...sp,
              images: Array.isArray(sp.images) ? sp.images : [],
              description: typeof sp.description === 'string' ? sp.description : '',
            })))
        }
      })
      .finally(() => setLoading(false))
  }, [isEdit, id])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleAddImage = () => {
    if (!imageUrl.trim()) {
      toast.error('Please enter an image URL')
      return
    }
    if (formData.images.length >= MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images per product`)
      return
    }
    setFormData((prev) => ({ ...prev, images: [...prev.images, imageUrl] }))
    setImageUrl('')
    toast.success('Image added')
  }

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null)
  const [draggedPendingIndex, setDraggedPendingIndex] = useState<number | null>(null)

  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    setDraggedImageIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleImageDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    setDraggedImageIndex(null)
    if (draggedImageIndex == null || draggedImageIndex === dropIndex) return
    setFormData((prev) => {
      const next = [...prev.images]
      const [removed] = next.splice(draggedImageIndex, 1)
      next.splice(dropIndex, 0, removed)
      return { ...prev, images: next }
    })
  }

  const handleImageDragEnd = () => {
    setDraggedImageIndex(null)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    const useB2 = isB2Configured
    if (!useB2 && !isFirebaseConfigured) {
      toast.error('Configure Backblaze B2 (VITE_B2_UPLOAD_API) or Firebase for image uploads')
      e.target.value = ''
      return
    }
    const currentTotal = formData.images.length + pendingFiles.length
    const toAdd = Math.min(MAX_IMAGES - currentTotal, files.length)
    if (toAdd <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images per product`)
      e.target.value = ''
      return
    }
    const newFiles = Array.from(files).slice(0, toAdd)
    setPendingFiles((prev) => [...prev, ...newFiles])
    if (toAdd < files.length) toast.info(`Added ${toAdd} of ${files.length} (max ${MAX_IMAGES} total).`)
    e.target.value = ''
  }

  const removePending = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePendingDragStart = (e: React.DragEvent, index: number) => {
    setDraggedPendingIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  const handlePendingDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handlePendingDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    setDraggedPendingIndex(null)
    if (draggedPendingIndex == null || draggedPendingIndex === dropIndex) return
    setPendingFiles((prev) => {
      const next = [...prev]
      const [removed] = next.splice(draggedPendingIndex, 1)
      next.splice(dropIndex, 0, removed)
      return next
    })
  }

  const handlePendingDragEnd = () => {
    setDraggedPendingIndex(null)
  }

  const uploadPending = async () => {
    if (!pendingFiles.length) return
    const useB2 = isB2Configured
    if (!useB2 && !isFirebaseConfigured) return
    setUploading(true)
    try {
      const uploads = pendingFiles.map((file) =>
        useB2 ? uploadFileToB2(file) : (async () => {
          const storageRef = ref(storage, `products/${id ?? 'new'}/${crypto.randomUUID()}-${file.name}`)
          const task = uploadBytesResumable(storageRef, file)
          await new Promise<void>((resolve, reject) => {
            task.on('state_changed', () => {}, reject, () => resolve())
          })
          return getDownloadURL(storageRef)
        })()
      )
      const urls = await Promise.all(uploads)
      setFormData((prev) => ({ ...prev, images: [...prev.images, ...urls] }))
      setPendingFiles([])
      toast.success(`${urls.length} image(s) uploaded`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleAddSubProduct = () => {
    if (!newSubProduct.name || !newSubProduct.sku || !newSubProduct.price) {
      toast.error('Please fill in all sub-product fields')
      return
    }
    setSubProducts((prev) => [
      ...prev,
      {
        ...newSubProduct,
        id: Date.now().toString(),
        images: newSubProduct.images ?? [],
        description: newSubProduct.description ?? '',
      },
    ])
    setNewSubProduct({ id: '', name: '', sku: '', price: '', stockCount: '', images: [], description: '' })
    toast.success('Sub-product added')
  }

  const handleRemoveSubProduct = (subId: string) => {
    setSubProducts((prev) => prev.filter((sp) => sp.id !== subId))
    if (expandedVariantId === subId) {
      setExpandedVariantId(null)
      setPendingVariantFiles([])
      setVariantImageUrl('')
    }
  }

  const updateVariant = (subId: string, updates: Partial<SubProduct>) => {
    setSubProducts((prev) =>
      prev.map((sp) => (sp.id === subId ? { ...sp, ...updates } : sp))
    )
  }

  const addVariantImageUrl = () => {
    if (!expandedVariantId || !variantImageUrl.trim()) return
    const sp = subProducts.find((s) => s.id === expandedVariantId)
    if (!sp || (sp.images?.length ?? 0) >= MAX_VARIANT_IMAGES) return
    const images = [...(sp.images ?? []), variantImageUrl.trim()]
    updateVariant(expandedVariantId, { images })
    setVariantImageUrl('')
    toast.success('Image added to variant')
  }

  const removeVariantImage = (subId: string, index: number) => {
    const sp = subProducts.find((s) => s.id === subId)
    if (!sp?.images) return
    const images = sp.images.filter((_, i) => i !== index)
    updateVariant(subId, { images })
  }

  const handleVariantFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!expandedVariantId) return
    const files = e.target.files
    if (!files?.length) return
    const sp = subProducts.find((s) => s.id === expandedVariantId)
    const current = (sp?.images?.length ?? 0) + pendingVariantFiles.length
    const toAdd = Math.min(MAX_VARIANT_IMAGES - current, files.length)
    if (toAdd <= 0) {
      toast.error(`Maximum ${MAX_VARIANT_IMAGES} images per variant`)
      e.target.value = ''
      return
    }
    setPendingVariantFiles((prev) => [...prev, ...Array.from(files).slice(0, toAdd)])
    e.target.value = ''
  }

  const uploadVariantPending = async () => {
    if (!pendingVariantFiles.length || !expandedVariantId) return
    const useB2 = isB2Configured
    if (!useB2 && !isFirebaseConfigured) return
    setUploading(true)
    try {
      const uploads = pendingVariantFiles.map((file) =>
        useB2 ? uploadFileToB2(file) : (async () => {
          const storageRef = ref(storage, `products/${id ?? 'new'}/variants/${expandedVariantId}/${crypto.randomUUID()}-${file.name}`)
          const task = uploadBytesResumable(storageRef, file)
          await new Promise<void>((resolve, reject) => {
            task.on('state_changed', () => {}, reject, () => resolve())
          })
          return getDownloadURL(storageRef)
        })()
      )
      const urls = await Promise.all(uploads)
      const sp = subProducts.find((s) => s.id === expandedVariantId)
      const images = [...(sp?.images ?? []), ...urls]
      updateVariant(expandedVariantId, { images })
      setPendingVariantFiles([])
      toast.success(`${urls.length} image(s) added to variant`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const addSpec = () => {
    setFormData((prev) => ({ ...prev, specifications: [...prev.specifications, { key: '', value: '' }] }))
  }
  const updateSpec = (index: number, field: 'key' | 'value', value: string) => {
    setFormData((prev) => {
      const next = [...prev.specifications]
      next[index] = { ...next[index], [field]: value }
      return { ...prev, specifications: next }
    })
  }
  const removeSpec = (index: number) => {
    setFormData((prev) => ({ ...prev, specifications: prev.specifications.filter((_, i) => i !== index) }))
  }

  const fillSpecsFromTable = () => {
    const parsed = parseSpecTable(specTablePaste)
    if (parsed.length === 0) {
      toast.error('No table rows found. Paste a markdown table like | Feature | Details |')
      return
    }
    setFormData((prev) => ({ ...prev, specifications: parsed }))
    toast.success(`${parsed.length} specification(s) filled from table.`)
    setSpecTablePaste('')
  }

  const addReview = () => {
    setFormData((prev) => ({
      ...prev,
      reviews: [...prev.reviews, { author: '', rating: 0, comment: '', date: new Date().toISOString().slice(0, 10) }],
    }))
  }
  const updateReview = (index: number, field: keyof ProductReview, value: string | number) => {
    setFormData((prev) => {
      const next = [...prev.reviews]
      next[index] = { ...next[index], [field]: value }
      return { ...prev, reviews: next }
    })
  }
  const removeReview = (index: number) => {
    setFormData((prev) => ({ ...prev, reviews: prev.reviews.filter((_, i) => i !== index) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.categoryId || !formData.basePrice) {
      toast.error('Please fill in all required fields')
      return
    }
    if (!isFirebaseConfigured) {
      toast.error('Firebase is not configured')
      return
    }
    setIsSubmitting(true)
    try {
      const priceNum = parseFloat(formData.basePrice) || 0
      const compareAt = formData.originalPrice ? parseFloat(formData.originalPrice) : null
      const payload = {
        name: formData.name,
        description: formData.description,
        shortDescription: formData.shortDescription || null,
        categoryId: formData.categoryId,
        price: priceNum,
        basePrice: priceNum,
        compareAtPrice: compareAt,
        originalPrice: formData.originalPrice || null,
        stockCount: formData.stockCount || '0',
        isNew: formData.isNew,
        featured: formData.featured,
        inStock: formData.inStock,
        localStock: formData.localStock,
        images: formData.images,
        tags: formData.tags,
        subProducts,
        flashSale: formData.flashSale,
        flashSalePrice: formData.flashSale ? (parseFloat(formData.flashSalePrice) || null) : null,
        flashSaleStartsAt: formData.flashSale && formData.flashSaleStartsAt.trim() ? formData.flashSaleStartsAt.trim() : null,
        flashSaleEndsAt: formData.flashSale && formData.flashSaleEndsAt.trim() ? formData.flashSaleEndsAt.trim() : null,
        rating: formData.rating !== '' ? (parseFloat(formData.rating) ?? null) : null,
        reviewCount: formData.reviewCount !== '' ? (parseInt(formData.reviewCount, 10) ?? null) : null,
        soldCount: formData.soldCount !== '' ? (parseInt(formData.soldCount, 10) ?? null) : null,
        specifications: formData.specifications.length
          ? Object.fromEntries(formData.specifications.filter((e) => e.key.trim()).map((e) => [e.key, e.value]))
          : null,
        reviews: formData.reviews.length ? formData.reviews : null,
        updatedAt: serverTimestamp(),
      }
      if (isEdit && id) {
        await updateDoc(doc(db, 'products', id), payload)
        toast.success('Product updated successfully!')
      } else {
        await addDoc(collection(db, 'products'), {
          ...payload,
          createdAt: serverTimestamp(),
        })
        clearDraft()
        toast.success('Product created successfully!')
      }
      navigate('/admin/products')
    } catch {
      toast.error(isEdit ? 'Failed to update product' : 'Failed to create product')
    } finally {
      setIsSubmitting(false)
    }
  }

  const labelClass = 'block text-sm font-medium text-gray-300 mb-2'

  const discardDraft = () => {
    clearDraft()
    setFormData({
      name: '',
      description: '',
      shortDescription: '',
      categoryId: '',
      basePrice: '',
      originalPrice: '',
      stockCount: '',
      isNew: true,
      featured: false,
      inStock: true,
      localStock: true,
      images: [],
      tags: [],
      flashSale: false,
      flashSalePrice: '',
      flashSaleStartsAt: '',
      flashSaleEndsAt: '',
      rating: '',
      reviewCount: '',
      soldCount: '',
      specifications: [],
      reviews: [],
    })
    setSubProducts([])
    setNewSubProduct({ id: '', name: '', sku: '', price: '', stockCount: '', images: [], description: '' })
    setExpandedVariantId(null)
    setPendingVariantFiles([])
    setVariantImageUrl('')
    setPendingFiles([])
    setImageUrl('')
    setIsDraftRestored(false)
    toast.info('Draft discarded. Form cleared.')
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-gray-400">Loading...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/products')}
            className="text-gray-400 hover:text-white hover:bg-gray-800/50"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="mt-1 text-gray-400">
              {isEdit ? 'Update product' : 'Create a new product with variants'}
            </p>
          </div>
        </div>

        {!isEdit && isDraftRestored && (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-600/50 bg-amber-900/20 px-4 py-3 text-amber-200">
            <p className="text-sm">
              You&apos;re editing a saved draft. Changes are auto-saved when you leave this page. Create the product when ready, or discard to start over.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={discardDraft} className="border-amber-600 text-amber-200 hover:bg-amber-900/40 shrink-0">
              Discard draft
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
            <h2 className="text-lg font-semibold text-white">Basic Information</h2>
            <div>
              <label className={labelClass}>Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
                className="admin-input"
              />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <p className="text-xs text-gray-500 mb-2">
                Use Markdown for lists and structure: <strong>**bold**</strong>, <code className="bg-gray-700 px-1 rounded">## Heading</code>, <code className="bg-gray-700 px-1 rounded">- bullet</code>. Put a blank line between paragraphs.
              </p>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder={`Short intro paragraph.\n\n## Key Features & Specifications\n\n- **Feature name:** Description here.\n- **Another:** More text.\n  - Nested bullet\n  - Another nested`}
                rows={14}
                className="admin-input font-mono text-sm"
              />
              {formData.description.trim() && (
                <div className="mt-3 rounded-lg border border-gray-600 bg-gray-900/50 p-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Preview (how it can look on the store)</p>
                  <div className="description-preview text-gray-300 text-sm space-y-2 [&_h2]:text-white [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-1 [&_h2:first-child]:mt-0 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_strong]:font-semibold [&_strong]:text-white">
                    <ReactMarkdown>{formData.description}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className={labelClass}>Short description (optional)</label>
              <textarea
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleInputChange}
                placeholder="Brief teaser for cards and listings"
                rows={2}
                className="admin-input"
              />
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Products appear under the main category in the shop. The full category path is used for sorting and search.
              </p>
              <div>
                <label className={labelClass}>Main category *</label>
                <select
                  name="categoryId"
                  value={categoryPath[0] ?? ''}
                  onChange={(e) => handleCategoryLevelChange(0, e.target.value)}
                  className="admin-input"
                >
                  <option value="">Select a category</option>
                  {rootCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              {categoryPath.map((parentId, levelIndex) => {
                const options = getChildrenOf(parentId)
                if (options.length === 0) return null
                const levelLabel = levelIndex === 0 ? 'Child category (optional)' : `Subcategory level ${levelIndex + 1} (optional)`
                const selectedId = categoryPath[levelIndex + 1] ?? ''
                return (
                  <div key={`${parentId}-${levelIndex}`}>
                    <label className={labelClass}>{levelLabel}</label>
                    <select
                      value={selectedId}
                      onChange={(e) => handleCategoryLevelChange(levelIndex + 1, e.target.value)}
                      className="admin-input"
                    >
                      <option value="">{levelIndex === 0 ? 'Main only' : 'None'}</option>
                      {options.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>
            <div>
              <label className={labelClass}>Tags (for search)</label>
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={(e) => {
                  const tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                  setFormData((prev) => ({ ...prev, tags }))
                }}
                placeholder="e.g. wireless, bluetooth, portable"
                className="admin-input"
              />
              <p className="text-xs text-gray-500 mt-1">Comma-separated. Used with category names for search on the store.</p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
            <h2 className="text-lg font-semibold text-white">Pricing & Stock</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Price *</label>
                <input type="number" name="basePrice" value={formData.basePrice} onChange={handleInputChange} placeholder="0.00" step="0.01" className="admin-input" />
              </div>
              <div>
                <label className={labelClass}>Compare at Price</label>
                <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleInputChange} placeholder="0.00" step="0.01" className="admin-input" />
              </div>
              <div>
                <label className={labelClass}>Stock Quantity</label>
                <input type="number" name="stockCount" value={formData.stockCount} onChange={handleInputChange} placeholder="0" className="admin-input" />
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="isNew" checked={formData.isNew} onChange={handleInputChange} className="w-4 h-4 rounded border-gray-500 bg-gray-700 accent-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-0" />
                <span className="text-gray-300">Mark as New</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="featured" checked={formData.featured} onChange={handleInputChange} className="w-4 h-4 rounded border-gray-500 bg-gray-700 accent-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-0" />
                <span className="text-gray-300">Featured Product</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="inStock" checked={formData.inStock} onChange={handleInputChange} className="w-4 h-4 rounded border-gray-500 bg-gray-700 accent-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-0" />
                <span className="text-gray-300">In Stock</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="localStock" checked={formData.localStock} onChange={handleInputChange} className="w-4 h-4 rounded border-gray-500 bg-gray-700 accent-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-0" />
                <span className="text-gray-300">Local stock</span>
              </label>
            </div>
            <p className="text-xs text-gray-500">Local stock = green “Local Stock” badge in shop; unchecked = “Ships from Overseas”.</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
            <h2 className="text-lg font-semibold text-white">Flash sale & social proof</h2>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="flashSale" checked={formData.flashSale} onChange={handleInputChange} className="w-4 h-4 rounded border-gray-500 bg-gray-700 accent-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-0" />
                <span className="text-gray-300">On flash sale</span>
              </label>
            </div>
            {formData.flashSale && (
              <div>
                <label className={labelClass}>Flash sale price</label>
                <input type="number" name="flashSalePrice" value={formData.flashSalePrice} onChange={handleInputChange} placeholder="0.00" step="0.01" className="admin-input w-40" />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Flash sale starts</label>
                <input type="datetime-local" name="flashSaleStartsAt" value={formData.flashSaleStartsAt} onChange={handleInputChange} className="admin-input w-full" />
                <p className="text-xs text-gray-500 mt-1">Optional. When &quot;On flash sale&quot; is checked, sale is active from this time.</p>
              </div>
              <div>
                <label className={labelClass}>Flash sale ends</label>
                <input type="datetime-local" name="flashSaleEndsAt" value={formData.flashSaleEndsAt} onChange={handleInputChange} className="admin-input w-full" />
                <p className="text-xs text-gray-500 mt-1">Optional. When &quot;On flash sale&quot; is checked, sale ends at this time (storefront can show countdown).</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Rating (0–5)</label>
                <input type="number" name="rating" value={formData.rating} onChange={handleInputChange} placeholder="0" min={0} max={5} step="0.1" className="admin-input" />
              </div>
              <div>
                <label className={labelClass}>Review count</label>
                <input type="number" name="reviewCount" value={formData.reviewCount} onChange={handleInputChange} placeholder="0" min={0} className="admin-input" />
              </div>
              <div>
                <label className={labelClass}>Sold count</label>
                <input type="number" name="soldCount" value={formData.soldCount} onChange={handleInputChange} placeholder="0" min={0} className="admin-input" />
              </div>
            </div>
            <p className="text-xs text-gray-500">Optional. Shown on product cards and detail (stars, “X sold”, etc.).</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
            <h2 className="text-lg font-semibold text-white">Product Images</h2>
            <p className="text-sm text-gray-400">
              Up to {MAX_IMAGES} images per product. Drag to reorder — the <strong>first image</strong> is used as the thumbnail in the shop. Remove with × before or after uploading.
            </p>
            <div className="flex gap-2">
              <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Or enter image URL" className="admin-input flex-1" />
              <Button type="button" onClick={handleAddImage} disabled={formData.images.length >= MAX_IMAGES} className="bg-orange-600 hover:bg-orange-700 text-white shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                Add URL
              </Button>
            </div>
            <div>
              <label className={labelClass}>
                Select images {isB2Configured && <span className="text-orange-400">(Backblaze B2)</span>}
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                disabled={!canAddMore}
                className="block w-full text-sm text-gray-400 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-600 file:px-4 file:py-2 file:text-white file:cursor-pointer disabled:opacity-50"
              />
              {!canAddMore && <p className="text-sm text-amber-400 mt-1">Maximum {MAX_IMAGES} images reached. Remove one to add more.</p>}
            </div>
            {pendingFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-300">Selected ({pendingFiles.length}) — drag to reorder (first = thumbnail), then click Upload</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {pendingFiles.map((file, idx) => (
                    <div
                      key={`pending-${idx}-${file.name}-${file.lastModified}`}
                      draggable
                      onDragStart={(e) => handlePendingDragStart(e, idx)}
                      onDragOver={handlePendingDragOver}
                      onDrop={(e) => handlePendingDrop(e, idx)}
                      onDragEnd={handlePendingDragEnd}
                      className={`relative group cursor-grab active:cursor-grabbing rounded-lg border-2 transition-shadow ${draggedPendingIndex === idx ? 'border-orange-500 shadow-lg ring-2 ring-orange-500/50 opacity-80' : 'border-orange-600/50 hover:border-orange-500/70'}`}
                    >
                      <span className="absolute top-2 left-2 z-10 bg-gray-900/90 text-gray-300 text-xs font-medium px-2 py-0.5 rounded">
                        {idx + 1}
                      </span>
                      {idx === 0 && (
                        <span className="absolute top-2 left-12 z-10 bg-orange-600 text-white text-xs font-medium px-2 py-0.5 rounded">
                          Thumbnail
                        </span>
                      )}
                      <img src={pendingPreviewUrls[idx] ?? ''} alt="" className="w-full h-32 object-cover rounded-lg pointer-events-none" draggable={false} />
                      <button type="button" onClick={() => removePending(idx)} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition z-10" title="Remove">
                        <X className="h-4 w-4 text-white" />
                      </button>
                      <p className="text-xs text-gray-500 truncate mt-1">{file.name}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => void uploadPending()} disabled={uploading} className="bg-orange-600 hover:bg-orange-700 text-white">
                    {uploading ? 'Uploading...' : `Upload ${pendingFiles.length} image${pendingFiles.length === 1 ? '' : 's'}`}
                  </Button>
                  <Button type="button" onClick={() => setPendingFiles([])} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                    Cancel all
                  </Button>
                </div>
              </div>
            )}
            {formData.images.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-300">Uploaded images ({formData.images.length}) — drag to reorder (first = thumbnail)</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((img, idx) => (
                    <div
                      key={img}
                      draggable
                      onDragStart={(e) => handleImageDragStart(e, idx)}
                      onDragOver={handleImageDragOver}
                      onDrop={(e) => handleImageDrop(e, idx)}
                      onDragEnd={handleImageDragEnd}
                      className={`relative group cursor-grab active:cursor-grabbing rounded-lg border-2 transition-shadow ${draggedImageIndex === idx ? 'border-orange-500 shadow-lg ring-2 ring-orange-500/50 opacity-80' : 'border-gray-700 hover:border-gray-600'}`}
                    >
                      <span className="absolute top-2 left-2 z-10 bg-gray-900/90 text-gray-300 text-xs font-medium px-2 py-0.5 rounded">
                        {idx + 1}
                      </span>
                      {idx === 0 && (
                        <span className="absolute top-2 left-12 z-10 bg-orange-600 text-white text-xs font-medium px-2 py-0.5 rounded">
                          Thumbnail
                        </span>
                      )}
                      <img src={img} alt="" className="w-full h-32 object-cover rounded-lg pointer-events-none" draggable={false} />
                      <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition z-10" title="Remove">
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
            <h2 className="text-lg font-semibold text-white">Specifications & reviews</h2>
            <p className="text-sm text-gray-400">Optional. Shown in product detail tabs.</p>
            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">Specifications (key-value)</p>
              <p className="text-xs text-gray-500 mb-2">
                Paste a markdown table (e.g. from a doc) with columns like Feature | Details — then click &quot;Fill from table&quot; to auto-fill the fields below.
              </p>
              <div className="flex gap-2 flex-wrap items-start mb-3">
                <textarea
                  value={specTablePaste}
                  onChange={(e) => setSpecTablePaste(e.target.value)}
                  placeholder={`| Feature            | Details                    |\n| ------------------ | -------------------------- |\n| Product Type       | Portable Car Wash Spray    |\n| Power Source       | Lithium-ion Battery        |`}
                  rows={6}
                  className="admin-input font-mono text-sm flex-1 min-w-[280px]"
                />
                <Button type="button" onClick={fillSpecsFromTable} className="bg-orange-600 hover:bg-orange-700 text-white shrink-0 self-center">
                  Fill from table
                </Button>
              </div>
              <div className="space-y-2">
                {formData.specifications.map((spec, idx) => (
                  <div key={idx} className="flex flex-wrap gap-2 items-center">
                    <input
                      value={spec.key}
                      onChange={(e) => updateSpec(idx, 'key', e.target.value)}
                      placeholder="e.g. Weight"
                      className="admin-input w-40"
                    />
                    <input
                      value={spec.value}
                      onChange={(e) => updateSpec(idx, 'value', e.target.value)}
                      placeholder="e.g. 2.5 kg"
                      className="admin-input flex-1 min-w-32"
                    />
                    <button type="button" onClick={() => removeSpec(idx)} className="p-2 hover:bg-red-500/20 rounded-lg transition" title="Remove">
                      <X className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
              <Button type="button" onClick={addSpec} variant="outline" size="sm" className="mt-2 border-gray-600 text-gray-300 hover:bg-gray-700">
                <Plus className="h-4 w-4 mr-2" />
                Add specification
              </Button>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">Reviews</p>
              <div className="space-y-3">
                {formData.reviews.map((rev, idx) => (
                  <div key={idx} className="bg-gray-700/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Review {idx + 1}</span>
                      <button type="button" onClick={() => removeReview(idx)} className="p-1 hover:bg-red-500/20 rounded"><X className="h-4 w-4 text-red-400" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input value={rev.author} onChange={(e) => updateReview(idx, 'author', e.target.value)} placeholder="Author" className="admin-input" />
                      <input type="number" min={0} max={5} step="0.1" value={rev.rating || ''} onChange={(e) => updateReview(idx, 'rating', e.target.value ? parseFloat(e.target.value) : 0)} placeholder="Rating 0–5" className="admin-input" />
                      <input type="date" value={rev.date} onChange={(e) => updateReview(idx, 'date', e.target.value)} placeholder="Date" className="admin-input md:col-span-2" />
                      <textarea value={rev.comment} onChange={(e) => updateReview(idx, 'comment', e.target.value)} placeholder="Comment" rows={2} className="admin-input md:col-span-2" />
                    </div>
                  </div>
                ))}
              </div>
              <Button type="button" onClick={addReview} variant="outline" size="sm" className="mt-2 border-gray-600 text-gray-300 hover:bg-gray-700">
                <Plus className="h-4 w-4 mr-2" />
                Add review
              </Button>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
            <h2 className="text-lg font-semibold text-white">Product Variants (Optional)</h2>
            <p className="text-sm text-gray-400">
              Each variant can have its own images and description. On the storefront, when a customer clicks a variant, show that variant&apos;s images and specs (price, stock, description).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input value={newSubProduct.name} onChange={(e) => setNewSubProduct((p) => ({ ...p, name: e.target.value }))} placeholder="Variant name" className="admin-input" />
              <input value={newSubProduct.sku} onChange={(e) => setNewSubProduct((p) => ({ ...p, sku: e.target.value }))} placeholder="SKU" className="admin-input" />
              <input type="number" value={newSubProduct.price} onChange={(e) => setNewSubProduct((p) => ({ ...p, price: e.target.value }))} placeholder="Price" step="0.01" className="admin-input" />
              <input type="number" value={newSubProduct.stockCount} onChange={(e) => setNewSubProduct((p) => ({ ...p, stockCount: e.target.value }))} placeholder="Stock" className="admin-input" />
            </div>
            <Button type="button" onClick={handleAddSubProduct} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              Add Variant
            </Button>
            {subProducts.length > 0 && (
              <div className="space-y-3">
                {subProducts.map((sp) => (
                  <div key={sp.id} className="bg-gray-700 rounded-lg border border-gray-600 overflow-hidden">
                    <div className="flex items-center justify-between p-3 flex-wrap gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium">{sp.name}</p>
                        <p className="text-sm text-gray-500">SKU: {sp.sku} | ${sp.price} | Stock: {sp.stockCount}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-gray-300 hover:bg-gray-600"
                          onClick={() => {
                            setExpandedVariantId((prev) => (prev === sp.id ? null : sp.id))
                            if (expandedVariantId !== sp.id) {
                              setPendingVariantFiles([])
                              setVariantImageUrl('')
                            }
                          }}
                        >
                          {expandedVariantId === sp.id ? 'Hide images & description' : 'Images & description'}
                        </Button>
                        <button type="button" onClick={() => handleRemoveSubProduct(sp.id)} className="p-2 hover:bg-red-500/20 rounded-lg transition" title="Remove variant">
                          <X className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                    {expandedVariantId === sp.id && (
                      <div className="border-t border-gray-600 p-4 space-y-4 bg-gray-800/50">
                        <div>
                          <p className="text-sm font-medium text-gray-300 mb-2">Variant images (up to {MAX_VARIANT_IMAGES}) — shown when this variant is selected on the store</p>
                          <div className="flex gap-2 flex-wrap items-center">
                            <input
                              type="text"
                              value={variantImageUrl}
                              onChange={(e) => setVariantImageUrl(e.target.value)}
                              placeholder="Image URL"
                              className="admin-input flex-1 min-w-48"
                            />
                            <Button type="button" onClick={addVariantImageUrl} disabled={!variantImageUrl.trim() || !canAddMoreVariantImages} className="bg-orange-600 hover:bg-orange-700 text-white shrink-0">
                              <Plus className="h-4 w-4 mr-2" />
                              Add URL
                            </Button>
                          </div>
                          <div className="mt-2">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleVariantFileSelect}
                              disabled={!canAddMoreVariantImages}
                              className="block w-full text-sm text-gray-400 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-600 file:px-4 file:py-2 file:text-white file:cursor-pointer disabled:opacity-50"
                            />
                          </div>
                          {pendingVariantFiles.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2 items-center">
                              <div className="flex gap-2 flex-wrap">
                                {pendingVariantFiles.map((_file, idx) => (
                                  <div key={`v-pending-${idx}`} className="relative w-24 h-24 rounded border border-orange-600/50 overflow-hidden">
                                    <img src={pendingVariantPreviewUrls[idx]} alt="" className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                              <Button type="button" onClick={() => void uploadVariantPending()} disabled={uploading} className="bg-orange-600 hover:bg-orange-700 text-white">
                                {uploading ? 'Uploading...' : `Upload ${pendingVariantFiles.length}`}
                              </Button>
                              <Button type="button" onClick={() => setPendingVariantFiles([])} variant="outline" size="sm" className="border-gray-600 text-gray-400">Cancel</Button>
                            </div>
                          )}
                          {(sp.images?.length ?? 0) > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {(sp.images ?? []).map((img, idx) => (
                                <div key={img} className="relative group w-24 h-24 rounded border border-gray-600 overflow-hidden">
                                  <img src={img} alt="" className="w-full h-full object-cover" />
                                  <button type="button" onClick={() => removeVariantImage(sp.id, idx)} className="absolute inset-0 bg-red-500/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                    <X className="h-6 w-6 text-white" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Variant description (optional) — Markdown supported; shown when this variant is selected</label>
                          <textarea
                            value={sp.description ?? ''}
                            onChange={(e) => updateVariant(sp.id, { description: e.target.value })}
                            placeholder="e.g. Specs, dimensions, or notes for this variant..."
                            rows={4}
                            className="admin-input font-mono text-sm w-full"
                          />
                          {(sp.description ?? '').trim() && (
                            <div className="mt-2 rounded border border-gray-600 bg-gray-900/50 p-3">
                              <p className="text-xs text-gray-500 mb-1">Preview</p>
                              <div className="description-preview text-gray-300 text-sm [&_h2]:text-white [&_strong]:text-white">
                                <ReactMarkdown>{sp.description}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting || !isFirebaseConfigured} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </Button>
            <Button type="button" onClick={() => navigate('/admin/products')} variant="outline" className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
