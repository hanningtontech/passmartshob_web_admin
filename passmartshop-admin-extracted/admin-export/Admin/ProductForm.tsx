import { useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { ChevronLeft, Upload, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "sonner";

interface Attribute {
  id: string;
  name: string;
  type: "text" | "number" | "select" | "boolean";
  value: string;
  options?: string[];
}

export default function AdminProductForm() {
  const [match, params] = useRoute("/admin/products/:id/edit");
  const [, setLocation] = useLocation();
  const isEdit = !!match;
  const productId = params?.id;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    basePrice: "",
    originalPrice: "",
    featured: false,
    isNew: false,
    inStock: true,
    stockCount: 0,
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoriesQuery = trpc.categories.list.useQuery();

  const attributeTypes = [
    { value: "text", label: "Text" },
    { value: "number", label: "Number" },
    { value: "select", label: "Select" },
    { value: "boolean", label: "Yes/No" },
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
            ? parseInt(value)
            : value,
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreviews((prev) => [
          ...prev,
          event.target?.result as string,
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const addAttribute = () => {
    setAttributes((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "",
        type: "text",
        value: "",
      },
    ]);
  };

  const removeAttribute = (id: string) => {
    setAttributes((prev) => prev.filter((attr) => attr.id !== id));
  };

  const updateAttribute = (
    id: string,
    field: keyof Attribute,
    value: any
  ) => {
    setAttributes((prev) =>
      prev.map((attr) =>
        attr.id === id ? { ...attr, [field]: value } : attr
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call with image upload to S3
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (isEdit) {
        toast.success("Product updated successfully!");
      } else {
        toast.success("Product created successfully!");
      }

      setLocation("/admin/products");
    } catch (error) {
      toast.error("Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/admin/products")}
            className="text-gray-400 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {isEdit ? "Edit Product" : "Add Product"}
            </h1>
            <p className="text-gray-400">
              {isEdit ? "Update product information" : "Create a new product"}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
            <h2 className="text-xl font-bold text-white">Basic Information</h2>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full bg-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                placeholder="Product description..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                >
                  <option value="">Select a category</option>
                  {categoriesQuery.data?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Stock Count
                </label>
                <input
                  type="number"
                  name="stockCount"
                  value={formData.stockCount}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
            <h2 className="text-xl font-bold text-white">Pricing</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleChange}
                  step="0.01"
                  required
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Compare at Price
                </label>
                <input
                  type="number"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Flags */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Product Flags</h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="w-4 h-4 rounded bg-gray-700 border border-gray-600 cursor-pointer"
                />
                <label htmlFor="featured" className="text-sm font-medium text-gray-300 cursor-pointer">
                  Featured Product
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isNew"
                  name="isNew"
                  checked={formData.isNew}
                  onChange={handleChange}
                  className="w-4 h-4 rounded bg-gray-700 border border-gray-600 cursor-pointer"
                />
                <label htmlFor="isNew" className="text-sm font-medium text-gray-300 cursor-pointer">
                  New Product
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="inStock"
                  name="inStock"
                  checked={formData.inStock}
                  onChange={handleChange}
                  className="w-4 h-4 rounded bg-gray-700 border border-gray-600 cursor-pointer"
                />
                <label htmlFor="inStock" className="text-sm font-medium text-gray-300 cursor-pointer">
                  In Stock
                </label>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
            <h2 className="text-xl font-bold text-white">Product Images</h2>

            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-orange-500 transition cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2"
              >
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-gray-300 font-medium">
                  Click to upload images
                </span>
                <span className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </span>
              </button>
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagePreviews.map((preview, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-lg overflow-hidden"
                  >
                    <img
                      src={preview}
                      alt={`Preview ${idx}`}
                      className="w-full h-24 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="h-6 w-6 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Attributes */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Product Attributes</h2>
              <Button
                type="button"
                size="sm"
                onClick={addAttribute}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Attribute
              </Button>
            </div>

            {attributes.length > 0 ? (
              <div className="space-y-4">
                {attributes.map((attr) => (
                  <div key={attr.id} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        Attribute Name
                      </label>
                      <input
                        type="text"
                        value={attr.name}
                        onChange={(e) =>
                          updateAttribute(attr.id, "name", e.target.value)
                        }
                        className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                        placeholder="e.g., Color, Size"
                      />
                    </div>

                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        Type
                      </label>
                      <select
                        value={attr.type}
                        onChange={(e) =>
                          updateAttribute(
                            attr.id,
                            "type",
                            e.target.value as Attribute["type"]
                          )
                        }
                        className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                      >
                        {attributeTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        Value
                      </label>
                      <input
                        type={attr.type === "number" ? "number" : "text"}
                        value={attr.value}
                        onChange={(e) =>
                          updateAttribute(attr.id, "value", e.target.value)
                        }
                        className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                        placeholder="Value"
                      />
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => removeAttribute(attr.id)}
                      className="bg-red-900 hover:bg-red-800 border-red-700 text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No attributes added. Click "Add Attribute" to add product attributes.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/admin/products")}
              className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isSubmitting
                ? "Saving..."
                : isEdit
                  ? "Update Product"
                  : "Create Product"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
