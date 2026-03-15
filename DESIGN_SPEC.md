# Passmartshop Admin – UI Design Spec

**Project matches the provided screenshots:** dark gray theme (gray-900 main, gray-800 sidebar/header), orange accents, flat modern cards.

Reference: User-provided screenshots (Dashboard, Categories, Product Types, Products, Import & Export).

---

## 1. Layout and theme

- **AdminLayout**
  - **Main area:** `bg-gray-900`
  - **Sidebar & header:** `bg-gray-800`, `border-gray-700`
  - **Accent:** Orange (e.g. `orange-500`, `orange-600`)
  - **Sidebar:** Collapsible (e.g. `w-64` / `w-20`)
  - **Logo:** “PS” in orange box, `rounded-lg` (`bg-orange-500`)
  - **View Store:** Plain link in header: `text-gray-400 hover:text-orange-400`
  - **Logout:** Button in sidebar footer; `variant="outline"` with `bg-gray-700 hover:bg-gray-600 border-gray-600`

- **Button**
  - **Primary:** `bg-orange-600 text-white hover:bg-orange-700`
  - **Outline / ghost:** Gray borders/backgrounds; **focus:** `focus-visible:ring-2 focus-visible:ring-orange-500`
  - **Link variant:** `text-orange-400 underline-offset-4 hover:underline`

---

## 2. Modern cards (shared pattern)

Use this card style everywhere for panels and sections:

- **Card:** `bg-gray-800 rounded-lg p-6 border border-gray-700`
- **Hover (where applicable):** `hover:border-gray-600 transition`

---

## 3. Dashboard

- **Stat cards (4):** Categories, Products, Orders, Revenue  
  - Same card style above.  
  - **Colored icon boxes:** `bg-blue-900` + `text-blue-400`, `bg-green-900` + `text-green-400`, `bg-orange-900` + `text-orange-400`, `bg-purple-900` + `text-purple-400`; icon in `p-3 rounded-lg`.

- **Quick Actions card:** One card; gray action buttons (e.g. `bg-gray-700 hover:bg-gray-600`) for “Manage Categories”, “Add New Category”, “Manage Products”, “Add New Product”.

- **System Status card:** Same card style; rows with green dot + “Connected” / “Running” (`text-green-400`).

- **Recent Activity card:** Same card style; rows separated by `border-b border-gray-700`.

---

## 4. List / table pages

- **Categories, Products, Product Types, Import/Export**
  - Search/filter panels and tables use the same card style: `bg-gray-800 rounded-lg border border-gray-700`.
  - Table header: `bg-gray-700 border-b border-gray-600`.
  - Table body: `divide-y divide-gray-700`; row hover e.g. `hover:bg-gray-700/80`.

---

## 5. Forms (Category & Product)

- **Section blocks:** Basic Info, Pricing & Stock, Images, Variants (etc.) each in a card: `bg-gray-800 rounded-lg p-6 border border-gray-700`.
  - Same pattern for Category form sections.

---

## 6. Inputs and focus

- Inputs: `bg-gray-700` (or `admin-input` with gray/orange in CSS), `focus:ring-2 focus:ring-orange-500`.
  - Keep `index.css` admin theme variables and `.admin-input` aligned with gray + orange.

Apply this spec to any new or changed admin screens so the UI stays consistent with the reference.
