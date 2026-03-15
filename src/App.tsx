import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { RequireAdmin } from './components/RequireAdmin'
import AdminDashboard from './routes/admin/Dashboard'
import AdminCategories from './routes/admin/Categories'
import AdminCategoryForm from './routes/admin/CategoryForm'
import AdminProducts from './routes/admin/Products'
import AdminProductForm from './routes/admin/ProductForm'
import AdminProductTypes from './routes/admin/ProductTypes'
import AdminImportExport from './routes/admin/ImportExport'
import AdminOrders from './routes/admin/Orders'
import AdminOrderDetail from './routes/admin/OrderDetail'

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" theme="dark" richColors />
      <Routes>
        <Route path="/login" element={<Navigate to="/admin" replace />} />
        <Route element={<RequireAdmin />}>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/categories/add" element={<AdminCategoryForm />} />
          <Route path="/admin/categories/:id/edit" element={<AdminCategoryForm />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/add" element={<AdminProductForm />} />
          <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
          <Route path="/admin/product-types" element={<AdminProductTypes />} />
          <Route path="/admin/import-export" element={<AdminImportExport />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
