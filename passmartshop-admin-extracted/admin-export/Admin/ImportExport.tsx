import { useState, useRef } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "sonner";

export default function AdminImportExport() {
  const [activeTab, setActiveTab] = useState<"import" | "export">("import");
  const [importType, setImportType] = useState<"products" | "categories">(
    "products"
  );
  const [exportType, setExportType] = useState<"products" | "categories" | "all">(
    "products"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      // Simulate file processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const fileSize = (file.size / 1024 / 1024).toFixed(2);
      toast.success(
        `Imported ${file.name} (${fileSize}MB) - 50 records processed successfully`
      );
    } catch (error) {
      toast.error("Failed to import file");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleExport = async () => {
    setIsProcessing(true);
    try {
      // Simulate export
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const timestamp = new Date().toISOString().split("T")[0];
      const fileName = `${exportType}-export-${timestamp}.csv`;

      toast.success(
        `Exported ${exportType} to ${fileName} - 150 records included`
      );
    } catch (error) {
      toast.error("Failed to export data");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Import & Export
          </h1>
          <p className="text-gray-400">
            Bulk manage your products and categories
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-700">
          <button
            onClick={() => setActiveTab("import")}
            className={`px-6 py-3 font-medium transition ${
              activeTab === "import"
                ? "text-orange-400 border-b-2 border-orange-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <Upload className="h-4 w-4 inline mr-2" />
            Import
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`px-6 py-3 font-medium transition ${
              activeTab === "export"
                ? "text-orange-400 border-b-2 border-orange-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <Download className="h-4 w-4 inline mr-2" />
            Export
          </button>
        </div>

        {/* Import Section */}
        {activeTab === "import" && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-4">
                  Import Type
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      value="products"
                      checked={importType === "products"}
                      onChange={(e) =>
                        setImportType(e.target.value as "products" | "categories")
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-gray-300">
                      Products (CSV/JSON with custom fields)
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      value="categories"
                      checked={importType === "categories"}
                      onChange={(e) =>
                        setImportType(e.target.value as "products" | "categories")
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-gray-300">
                      Categories (nested hierarchy support)
                    </span>
                  </label>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center hover:border-orange-500 transition">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,.xlsx"
                  onChange={handleImportFile}
                  disabled={isProcessing}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="flex flex-col items-center gap-3"
                >
                  <Upload className="h-12 w-12 text-gray-400" />
                  <div>
                    <p className="text-gray-300 font-medium">
                      Click to select file or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supported: CSV, JSON, XLSX (max 50MB)
                    </p>
                  </div>
                </button>
              </div>

              <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                  <strong>Format Guide:</strong> Your file should include columns
                  for: name, description, price, category, and any custom fields
                  defined in your product types.
                </p>
              </div>
            </div>

            {/* Import History */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-bold text-white mb-4">Recent Imports</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <p className="text-white font-medium">products-batch-1.csv</p>
                    <p className="text-sm text-gray-400">
                      150 products imported • 2 hours ago
                    </p>
                  </div>
                  <span className="text-green-400 text-sm">Success</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <p className="text-white font-medium">categories.json</p>
                    <p className="text-sm text-gray-400">
                      25 categories imported • 1 day ago
                    </p>
                  </div>
                  <span className="text-green-400 text-sm">Success</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Section */}
        {activeTab === "export" && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-4">
                  Export Type
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      value="products"
                      checked={exportType === "products"}
                      onChange={(e) =>
                        setExportType(e.target.value as any)
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-gray-300">Products only</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      value="categories"
                      checked={exportType === "categories"}
                      onChange={(e) =>
                        setExportType(e.target.value as any)
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-gray-300">Categories only</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      value="all"
                      checked={exportType === "all"}
                      onChange={(e) =>
                        setExportType(e.target.value as any)
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-gray-300">Everything</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleExport}
                  disabled={isProcessing}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isProcessing ? "Exporting..." : "Export as CSV"}
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={isProcessing}
                  variant="outline"
                  className="flex-1 bg-gray-700 hover:bg-gray-600 border-gray-600 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as JSON
                </Button>
              </div>

              <div className="bg-green-900 border border-green-700 rounded-lg p-4">
                <p className="text-green-300 text-sm">
                  <strong>Tip:</strong> Export your data regularly for backup
                  purposes. JSON format preserves all custom fields and nested
                  structures.
                </p>
              </div>
            </div>

            {/* Export History */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-bold text-white mb-4">Export History</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <p className="text-white font-medium">
                      products-export-2026-03-04.csv
                    </p>
                    <p className="text-sm text-gray-400">
                      250 products • 1.2 MB • 2 hours ago
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-gray-600 hover:bg-gray-500 border-gray-500 text-gray-300"
                  >
                    Download
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <p className="text-white font-medium">
                      all-export-2026-03-01.json
                    </p>
                    <p className="text-sm text-gray-400">
                      All data • 3.5 MB • 3 days ago
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-gray-600 hover:bg-gray-500 border-gray-500 text-gray-300"
                  >
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
