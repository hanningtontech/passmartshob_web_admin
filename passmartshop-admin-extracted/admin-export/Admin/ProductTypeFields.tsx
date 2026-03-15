import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { ChevronLeft, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "sonner";

interface Field {
  id: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  required: boolean;
  options?: string[];
}

export default function AdminProductTypeFields() {
  const [match, params] = useRoute("/admin/product-types/:id/fields");
  const [, setLocation] = useLocation();
  const typeId = params?.id;

  const [fields, setFields] = useState<Field[]>([
    {
      id: "1",
      fieldName: "brand",
      fieldLabel: "Brand",
      fieldType: "text",
      required: true,
    },
    {
      id: "2",
      fieldName: "warranty",
      fieldLabel: "Warranty (months)",
      fieldType: "number",
      required: false,
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Field>>({
    fieldName: "",
    fieldLabel: "",
    fieldType: "text",
    required: false,
    options: [],
  });

  const fieldTypes = [
    { value: "text", label: "Text" },
    { value: "number", label: "Number" },
    { value: "textarea", label: "Text Area" },
    { value: "select", label: "Dropdown" },
    { value: "multiselect", label: "Multi-select" },
    { value: "checkbox", label: "Checkbox" },
    { value: "date", label: "Date" },
    { value: "color", label: "Color Picker" },
    { value: "image", label: "Image" },
  ];

  const handleAddField = () => {
    if (!formData.fieldName || !formData.fieldLabel) {
      toast.error("Field name and label are required");
      return;
    }

    if (editingId) {
      setFields((prev) =>
        prev.map((f) =>
          f.id === editingId ? { ...f, ...formData } : f
        )
      );
      toast.success("Field updated");
    } else {
      setFields((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          fieldName: formData.fieldName || "",
          fieldLabel: formData.fieldLabel || "",
          fieldType: formData.fieldType || "text",
          required: formData.required || false,
          options: formData.options,
        },
      ]);
      toast.success("Field added");
    }

    setFormData({
      fieldName: "",
      fieldLabel: "",
      fieldType: "text",
      required: false,
      options: [],
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (field: Field) => {
    setFormData(field);
    setEditingId(field.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    toast.success("Field deleted");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/admin/product-types")}
            className="text-gray-400 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Product Type Fields</h1>
            <p className="text-gray-400">Manage custom fields for this product type</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
              <h2 className="text-lg font-bold text-white">
                {editingId ? "Edit Field" : "Add New Field"}
              </h2>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Field Name *
                </label>
                <input
                  type="text"
                  value={formData.fieldName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, fieldName: e.target.value })
                  }
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                  placeholder="e.g., brand, warranty"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used in database (no spaces)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Display Label *
                </label>
                <input
                  type="text"
                  value={formData.fieldLabel || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, fieldLabel: e.target.value })
                  }
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                  placeholder="e.g., Brand Name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Field Type
                </label>
                <select
                  value={formData.fieldType || "text"}
                  onChange={(e) =>
                    setFormData({ ...formData, fieldType: e.target.value })
                  }
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                >
                  {fieldTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="required"
                  checked={formData.required || false}
                  onChange={(e) =>
                    setFormData({ ...formData, required: e.target.checked })
                  }
                  className="w-4 h-4 rounded bg-gray-700 border border-gray-600 cursor-pointer"
                />
                <label htmlFor="required" className="text-sm font-medium text-gray-300 cursor-pointer">
                  Required Field
                </label>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAddField}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {editingId ? "Update Field" : "Add Field"}
                </Button>
                {editingId && (
                  <Button
                    onClick={() => {
                      setEditingId(null);
                      setFormData({
                        fieldName: "",
                        fieldLabel: "",
                        fieldType: "text",
                        required: false,
                      });
                    }}
                    variant="outline"
                    className="flex-1 bg-gray-700 hover:bg-gray-600 border-gray-600 text-white"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Fields List */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700 border-b border-gray-600">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Field Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Label
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Required
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {fields.map((field) => (
                      <tr key={field.id} className="hover:bg-gray-750 transition">
                        <td className="px-6 py-4 text-white font-mono text-sm">
                          {field.fieldName}
                        </td>
                        <td className="px-6 py-4 text-gray-300">{field.fieldLabel}</td>
                        <td className="px-6 py-4">
                          <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
                            {fieldTypes.find((t) => t.value === field.fieldType)
                              ?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {field.required ? (
                            <span className="text-orange-400 text-sm">Yes</span>
                          ) : (
                            <span className="text-gray-500 text-sm">No</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300"
                              onClick={() => handleEdit(field)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-red-900 hover:bg-red-800 border-red-700 text-red-300"
                              onClick={() => handleDelete(field.id)}
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
        </div>
      </div>
    </AdminLayout>
  );
}
