import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { ChevronLeft, Upload, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "sonner";

interface CustomField {
  id: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  value: any;
  required: boolean;
}

export default function AdminFlexibleProductForm() {
  const [match, params] = useRoute("/admin/products/:id/edit");
  const [, setLocation] = useLocation();
  const isEdit = !!match;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    productTypeId: "",
    basePrice: "",
    originalPrice: "",
    featured: false,
    isNew: false,
    inStock: true,
    stockCount: 0,
  });

  const [customFields, setCustomFields] = useState<CustomField[]>([
    {
      id: "1",
      fieldName: "brand",
      fieldLabel: "Brand",
      fieldType: "text",
      value: "",
      required: true,
    },
    {
      id: "2",
      fieldName: "warranty",
      fieldLabel: "Warranty (months)",
      fieldType: "number",
      value: "",
      required: false,
    },
  ]);

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCustomFieldChange = (id: string, value: any) => {
    setCustomFields((prev) =>
      prev.map((field) => (field.id === id ? { ...field, value } : field))
    );
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required custom fields
      const missingRequired = customFields.filter(
        (f) => f.required && !f.value
      );
      if (missingRequired.length > 0) {
        toast.error(
          `Missing required fields: ${missingRequired.map((f) => f.fieldLabel).join(", ")}`
        );
        setIsSubmitting(false);
        return;
      }

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

  const renderCustomField = (field: CustomField) => {
    const commonProps = {
      className:
        "w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600",
    };

    switch (field.fieldType) {
      case "text":
        return (
          <input
            type="text"
            {...commonProps}
            value={field.value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            placeholder={field.fieldLabel}
          />
        );

      case "number":
        return (
          <input
            type="number"
            {...commonProps}
            value={field.value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            placeholder={field.fieldLabel}
          />
        );

      case "textarea":
        return (
          <textarea
            {...commonProps}
            value={field.value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            placeholder={field.fieldLabel}
            rows={3}
          />
        );

      case "select":
        return (
          <select
            {...commonProps}
            value={field.value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
          >
            <option value="">Select {field.fieldLabel}</option>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
          </select>
        );

      case "checkbox":
        return (
          <input
            type="checkbox"
            checked={field.value}
            onChange={(e) =>
              handleCustomFieldChange(field.id, e.target.checked)
            }
            className="w-4 h-4 rounded bg-gray-700 border border-gray-600 cursor-pointer"
          />
        );

      case "date":
        return (
          <input
            type="date"
            {...commonProps}
            value={field.value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
          />
        );

      case "color":
        return (
          <input
            type="color"
            {...commonProps}
            value={field.value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
          />
        );

      default:
        return null;
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
              Create or update product with flexible fields
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
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
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
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
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
                  <option value="1">Home Appliances</option>
                  <option value="2">Electronics</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Product Type
                </label>
                <select
                  name="productTypeId"
                  value={formData.productTypeId}
                  onChange={handleChange}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                >
                  <option value="">Select product type</option>
                  <option value="1">Electronics</option>
                  <option value="2">Appliances</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
            <h2 className="text-xl font-bold text-white">Pricing & Stock</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {/* Custom Fields */}
          {customFields.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
              <h2 className="text-xl font-bold text-white">Product Details</h2>

              <div className="space-y-4">
                {customFields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      {field.fieldLabel}
                      {field.required && <span className="text-red-400"> *</span>}
                    </label>
                    {renderCustomField(field)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Images */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
            <h2 className="text-xl font-bold text-white">Product Images</h2>

            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-orange-500 transition cursor-pointer">
              <label className="flex flex-col items-center gap-2 cursor-pointer">
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-gray-300 font-medium">
                  Click to upload images
                </span>
                <span className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
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
