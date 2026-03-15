# Passmartshop Admin Dashboard - Setup Guide

## Overview
The admin dashboard is a professional, dark-themed interface for managing products, categories, and orders in the Passmartshop e-commerce platform.

## File Structure

### Admin Pages (`/pages/Admin/`)
- **Dashboard.tsx** - Main admin dashboard with statistics and quick actions
- **Categories.tsx** - Category management list view
- **CategoryForm.tsx** - Add/Edit category form
- **Products.tsx** - Product management list view with search
- **SimpleProductForm.tsx** - Add/Edit product form (currently active)
- **ProductForm.tsx** - Alternative flexible product form
- **FlexibleProductForm.tsx** - Advanced flexible product form
- **ProductTypes.tsx** - Product type management
- **ProductTypeFields.tsx** - Custom fields for product types
- **ImportExport.tsx** - Bulk import/export functionality

### Admin Layout
- **AdminLayout.tsx** - Main admin layout component with sidebar navigation

## Features

### 1. Dashboard
- Statistics cards (Total Categories, Products, Orders, Revenue)
- Quick actions buttons
- System status indicators
- Recent activity feed

### 2. Category Management
- List all categories with predefined options:
  - Home & Kitchen
  - Electronics & Appliances
  - Office Products
  - Sports & Outdoors
  - Toys & Games
  - Kids & Baby Products
  - Shoes
  - Phones & Accessories
  - Computers & Accessories
  - Bags
- Add custom categories
- Edit category details
- Delete categories

### 3. Product Management
- List all products with search and filtering
- Add new products with:
  - Product name
  - Description
  - Category selection
  - Price and compare-at-price
  - Stock quantity
  - Product images (URL-based)
  - Product variants/sub-products
  - Flags: New, Featured, In Stock
- Edit existing products
- Delete products

### 4. Product Types (Advanced)
- Create custom product types
- Define custom fields for each type
- Supported field types:
  - Text
  - Number
  - Textarea
  - Select
  - Multiselect
  - Checkbox
  - Date
  - Color
  - Image

### 5. Import/Export
- Export products to CSV/JSON/XLSX
- Import products from external sources
- Bulk category management

## Routing

Admin routes are automatically separated from customer routes:

```
/admin                      → Dashboard
/admin/categories           → Categories list
/admin/categories/add       → Add category
/admin/categories/:id/edit  → Edit category
/admin/products             → Products list
/admin/products/add         → Add product
/admin/products/:id/edit    → Edit product
/admin/product-types        → Product types
/admin/product-types/:id/fields → Product type fields
/admin/import-export        → Import/Export
```

## Styling

The admin dashboard uses:
- Dark theme (bg-gray-900, text-gray-100)
- Orange accent color (#FF6B35)
- Responsive design
- Professional UI components from shadcn/ui
- Tailwind CSS for styling

## Database Integration

The admin dashboard connects to:
- **MySQL Database** - For storing products, categories, orders
- **tRPC Backend** - For API calls
- **Backblaze S3** - For product image storage (optional)

## Key Components

### AdminLayout
- Collapsible sidebar navigation
- User profile display
- Logout functionality
- Top header with "View Store" link

### Navigation Items
- Dashboard
- Categories
- Product Types
- Products
- Import/Export

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd /path/to/passmartshop
   pnpm install
   ```

2. **Start Development Server**
   ```bash
   pnpm dev
   ```

3. **Access Admin Dashboard**
   - Navigate to `http://localhost:3000/admin`
   - The admin interface will load with the dark theme

4. **Configure Backblaze S3 (Optional)**
   - Add Backblaze B2 credentials to environment variables
   - Product images will be uploaded to S3 with CDN delivery

## Environment Variables

Required environment variables:
```
DATABASE_URL=mysql://user:password@host/database
JWT_SECRET=your-secret-key
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=your-oauth-url
```

Optional for image storage:
```
BACKBLAZE_KEY_ID=your-key-id
BACKBLAZE_APP_KEY=your-app-key
BACKBLAZE_BUCKET_NAME=your-bucket
```

## Future Enhancements

1. **Admin Authentication** - Email/password login or OAuth
2. **Order Management** - View and update order status
3. **Analytics Dashboard** - Revenue, sales trends, customer insights
4. **Bulk Actions** - Delete multiple products, bulk price updates
5. **Product Templates** - Quick product creation from templates
6. **Customer Management** - View customer details and order history
7. **Email Notifications** - Order confirmations, admin alerts

## Notes

- The admin interface is completely separated from the customer-facing website
- All admin routes load with AdminLayout instead of the customer Layout
- The sidebar navigation is collapsible for better space management
- All forms include validation and error handling
- The dashboard is fully responsive and works on mobile devices

## Support

For issues or questions about the admin dashboard, refer to the main project README or contact the development team.
