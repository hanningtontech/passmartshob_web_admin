import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Upload, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface SubProduct {
  id: string;
  name: string;
  sku: string;
  price: string;
  stockCount: string;
}

export default function SimpleProductForm() {
  const [, setLocation] = useLocation();
  const categoriesQuery = trpc.categories.list.useQuery();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    basePrice: "",
    originalPrice: "",
    stockCount: "",
    isNew: true,
    featured: false,
    inStock: true,
    images: [] as string[],
  });

  const [subProducts, setSubProducts] = useState<SubProduct[]>([]);
  const [newSubProduct, setNewSubProduct] = useState<SubProduct>({
    id: "",
    name: "",
    sku: "",
    price: "",
    stockCount: "",
  });

  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddImage = () => {
    if (!imageUrl.trim()) {
      toast.error("Please enter an image URL");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, imageUrl],
    }));
    setImageUrl("");
    toast.success("Image added successfully");
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleAddSubProduct = () => {
    if (!newSubProduct.name || !newSubProduct.sku || !newSubProduct.price) {
      toast.error("Please fill in all sub-product fields");
      return;
    }

    setSubProducts((prev) => [
      ...prev,
      {
        ...newSubProduct,
        id: Date.now().toString(),
      },
    ]);

    setNewSubProduct({
      id: "",
      name: "",
      sku: "",
      price: "",
      stockCount: "",
    });
    toast.success("Sub-product added");
  };

  const handleRemoveSubProduct = (id: string) => {
    setSubProducts((prev) => prev.filter((sp) => sp.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.categoryId || !formData.basePrice) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("Product Data:", {
        ...formData,
        subProducts,
      });

      toast.success("Product created successfully!");
      setLocation("/admin/products");
    } catch (error) {
      toast.error("Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocation("/admin/products")}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <ChevronLeft className="h-6 w-6 text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Add New Product</h1>
            <p className="text-gray-400">Create a new product with variants</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
            <h2 className="text-xl font-bold text-white">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
                className="w-full bg-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter product description"
                rows={4}
                className="w-full bg-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select a category</option>
                {categoriesQuery.data?.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
            <h2 className="text-xl font-bold text-white">Pricing & Stock</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full bg-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Compare at Price
                </label>
                <input
                  type="number"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full bg-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stockCount"
                  value={formData.stockCount}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="w-full bg-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isNew"
                  checked={formData.isNew}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded"
                />
                <span className="text-gray-300">Mark as New</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded"
                />
                <span className="text-gray-300">Featured Product</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="inStock"
                  checked={formData.inStock}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded"
                />
                <span className="text-gray-300">In Stock</span>
              </label>
            </div>
          </div>

          {/* Product Images */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
            <h2 className="text-xl font-bold text-white">Product Images</h2>

            <div className="flex gap-2">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                className="flex-1 bg-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Button
                type="button"
                onClick={handleAddImage}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Image
              </Button>
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img}
                      alt={`Product ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23333' width='100' height='100'/%3E%3Ctext x='50%' y='50%' fill='%23999' text-anchor='middle' dy='.3em'%3EImage%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 p-1 rounded opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sub-Products/Variants */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
            <h2 className="text-xl font-bold text-white">
              Product Variants (Optional)
            </h2>
            <p className="text-sm text-gray-400">
              Add different variants like colors, sizes, or models
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={newSubProduct.name}
                  onChange={(e) =>
                    setNewSubProduct((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Variant name (e.g., Red, Large)"
                  className="bg-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />

                <input
                  type="text"
                  value={newSubProduct.sku}
                  onChange={(e) =>
                    setNewSubProduct((prev) => ({
                      ...prev,
                      sku: e.target.value,
                    }))
                  }
                  placeholder="SKU"
                  className="bg-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />

                <input
                  type="number"
                  value={newSubProduct.price}
                  onChange={(e) =>
                    setNewSubProduct((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                  placeholder="Price"
                  step="0.01"
                  className="bg-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />

                <input
                  type="number"
                  value={newSubProduct.stockCount}
                  onChange={(e) =>
                    setNewSubProduct((prev) => ({
                      ...prev,
                      stockCount: e.target.value,
                    }))
                  }
                  placeholder="Stock"
                  className="bg-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <Button
                type="button"
                onClick={handleAddSubProduct}
                variant="outline"
                className="w-full bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Variant
              </Button>
            </div>

            {subProducts.length > 0 && (
              <div className="space-y-2">
                {subProducts.map((sp) => (
                  <div
                    key={sp.id}
                    className="flex items-center justify-between bg-gray-700 p-3 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{sp.name}</p>
                      <p className="text-sm text-gray-400">
                        SKU: {sp.sku} | Price: ${sp.price} | Stock: {sp.stockCount}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubProduct(sp.id)}
                      className="p-2 hover:bg-red-600 rounded transition"
                    >
                      <X className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isSubmitting ? "Creating..." : "Create Product"}
            </Button>
            <Button
              type="button"
              onClick={() => setLocation("/admin/products")}
              variant="outline"
              className="flex-1 bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
