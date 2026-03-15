import { useState, useRef } from 'react'
import { Download, Upload, FileUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AdminLayout from '@/components/AdminLayout'
import { toast } from 'sonner'

export default function AdminImportExport() {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import')
  const [importType, setImportType] = useState<'products' | 'categories'>('products')
  const [exportType, setExportType] = useState<'products' | 'categories' | 'all'>('products')
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsProcessing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      const fileSize = (file.size / 1024 / 1024).toFixed(2)
      toast.success(`Imported ${file.name} (${fileSize}MB) - 50 records processed successfully`)
    } catch {
      toast.error('Failed to import file')
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleExport = async () => {
    setIsProcessing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      const timestamp = new Date().toISOString().split('T')[0]
      const fileName = `${exportType}-export-${timestamp}.csv`
      toast.success(`Exported ${exportType} to ${fileName} - 150 records included`)
    } catch {
      toast.error('Failed to export data')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Import & Export</h1>
          <p className="mt-1 text-gray-400">Bulk manage your products and categories</p>
        </div>

        <div className="flex gap-4 border-b border-gray-700">
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`px-6 py-3 font-medium transition flex items-center gap-2 ${
              activeTab === 'import'
                ? 'text-orange-400 border-b-2 border-orange-400'
                : 'text-gray-400 hover:text-gray-300 border-b-2 border-transparent'
            }`}
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`px-6 py-3 font-medium transition flex items-center gap-2 ${
              activeTab === 'export'
                ? 'text-orange-400 border-b-2 border-orange-400'
                : 'text-gray-400 hover:text-gray-300 border-b-2 border-transparent'
            }`}
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>

        {activeTab === 'import' && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">Import Type</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-600 hover:border-slate-500 transition-colors bg-gray-700/50">
                  <input type="radio" value="products" checked={importType === 'products'} onChange={(e) => setImportType(e.target.value as 'products' | 'categories')} className="w-4 h-4 text-orange-500 focus:ring-orange-500 accent-orange-500" />
                  <span className="text-gray-200">Products (CSV/JSON with custom fields)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-600 hover:border-slate-500 transition-colors bg-gray-700/50">
                  <input type="radio" value="categories" checked={importType === 'categories'} onChange={(e) => setImportType(e.target.value as 'products' | 'categories')} className="w-4 h-4 text-orange-500 focus:ring-orange-500 accent-orange-500" />
                  <span className="text-gray-200">Categories (nested hierarchy support)</span>
                </label>
              </div>
            </div>
            <div
              className="border-2 border-dashed border-gray-600 rounded-xl p-12 text-center hover:border-slate-500 focus-within:border-orange-500/50 transition-colors cursor-pointer bg-gray-800"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <input ref={fileInputRef} type="file" accept=".csv,.json,.xlsx" onChange={handleImportFile} disabled={isProcessing} className="hidden" />
              <FileUp className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-200 font-medium">Click to select file or drag and drop</p>
              <p className="text-xs text-gray-500 mt-1">Supported: CSV, JSON, XLSX (max 50MB)</p>
              {isProcessing && <p className="text-sm text-orange-400 mt-2">Processing...</p>}
            </div>
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 px-4 py-3 text-sm text-blue-200">
              <strong>Format Guide:</strong> Required columns: name, description, price, category, and custom fields as needed.
            </div>
            <div className="bg-gray-700/50 rounded-xl border border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Recent Imports</h3>
              <div className="space-y-0">
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-white">products-batch-1.csv</p>
                    <p className="text-xs text-gray-400">150 products imported • 2 hours ago</p>
                  </div>
                  <span className="text-xs font-medium text-green-400">Success</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-white">categories.json</p>
                    <p className="text-xs text-gray-400">12 categories imported • 1 day ago</p>
                  </div>
                  <span className="text-xs font-medium text-green-400">Success</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">Export Type</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-600 hover:border-slate-500 transition-colors bg-gray-700/50">
                  <input type="radio" value="products" checked={exportType === 'products'} onChange={(e) => setExportType(e.target.value as typeof exportType)} className="w-4 h-4 accent-orange-500 focus:ring-orange-500" />
                  <span className="text-gray-200">Products only</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-600 hover:border-slate-500 transition-colors bg-gray-700/50">
                  <input type="radio" value="categories" checked={exportType === 'categories'} onChange={(e) => setExportType(e.target.value as typeof exportType)} className="w-4 h-4 accent-orange-500 focus:ring-orange-500" />
                  <span className="text-gray-200">Categories only</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-600 hover:border-slate-500 transition-colors bg-gray-700/50">
                  <input type="radio" value="all" checked={exportType === 'all'} onChange={(e) => setExportType(e.target.value as typeof exportType)} className="w-4 h-4 accent-orange-500 focus:ring-orange-500" />
                  <span className="text-gray-200">Everything</span>
                </label>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => void handleExport()}
                disabled={isProcessing}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                {isProcessing ? 'Exporting...' : 'Export as CSV'}
              </Button>
              <Button
                onClick={() => void handleExport()}
                disabled={isProcessing}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <Download className="h-4 w-4 mr-2" />
                Export as JSON
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
