# Cursor AI Setup Guide – Passmartshop Admin Dashboard

This project is the **Passmartshop admin dashboard** with the UI from the setup guide. Below is how it maps to the guide and how to work with it in Cursor.

---

## How This Project Differs From the Original Guide

| Guide / Downloads | This project |
|-------------------|--------------|
| **Router** | **React Router** (`react-router-dom`), not wouter |
| **Data** | **Firebase** (Firestore), not tRPC mock |
| **Auth** | **Firebase Auth** via `src/hooks/useAuth.ts` |
| **Admin pages** | `src/routes/admin/*` (e.g. `Dashboard.tsx`, `Categories.tsx`) |
| **Layout** | `src/components/AdminLayout.tsx` |
| **Tailwind** | Tailwind v4 + `tailwind.config.js` with extended theme |

The **UI** (gray/slate + orange, cards, sidebar, Dashboard, Categories, Products, Product Types, Import/Export) matches the guide; routing and data are adapted for React Router + Firebase.

---

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Routes redirect to `/admin` (Dashboard).

---

## File Structure (This Project)

```
src/
├── components/
│   ├── AdminLayout.tsx       # Sidebar + header + main area
│   ├── RequireAdmin.tsx      # Auth guard for admin routes
│   ├── dashboard/            # Dashboard stat/quick actions/status/activity
│   └── ui/
│       ├── button.tsx
│       └── skeleton.tsx
├── hooks/
│   └── useAuth.ts            # Firebase Auth (admin check)
├── lib/
│   └── utils.ts              # cn() for class names (clsx + tailwind-merge)
├── routes/
│   └── admin/
│       ├── Dashboard.tsx
│       ├── Categories.tsx
│       ├── CategoryForm.tsx
│       ├── Products.tsx
│       ├── ProductForm.tsx
│       ├── ProductTypes.tsx
│       └── ImportExport.tsx
├── firebase.ts               # Firebase config + Firestore
├── App.tsx
├── main.tsx
└── index.css
```

---

## Key Paths for Cursor

When editing or generating admin UI code:

- **Layout:** `src/components/AdminLayout.tsx`
- **Dashboard:** `src/routes/admin/Dashboard.tsx`
- **Categories list:** `src/routes/admin/Categories.tsx`
- **Category add/edit:** `src/routes/admin/CategoryForm.tsx`
- **Products list:** `src/routes/admin/Products.tsx`
- **Product add/edit:** `src/routes/admin/ProductForm.tsx`
- **Product Types:** `src/routes/admin/ProductTypes.tsx`
- **Import/Export:** `src/routes/admin/ImportExport.tsx`
- **Styles:** `src/index.css`
- **Theme (colors/spacing):** `tailwind.config.js`

---

## Design Spec

See **DESIGN_SPEC.md** for the UI spec (gray-900/800, orange accent, card styles). The current UI follows the provided screenshots (gray theme, flat cards).

---

## Optional: Adding Guide-Style Dependencies

If you want to use the exact Button/Skeleton from the guide (with `cn()`):

```bash
npm install clsx tailwind-merge
```

`src/lib/utils.ts` already exports `cn()` for use in components.

---

## Tailwind Theme (From Guide)

`tailwind.config.js` is extended with slate/orange and sidebar spacing so you can use:

- `bg-slate-950`, `bg-slate-900`, `bg-slate-800`, etc.
- `orange-500`, `orange-600`, `orange-400`
- `sidebar`, `sidebar-collapsed` spacing

---

## Troubleshooting

- **Styles not applying:** Ensure `src/index.css` is imported in `src/main.tsx`. Run `npm run build` to confirm.
- **Routes:** All admin routes are under `Route element={<RequireAdmin />}>` in `App.tsx`. Unauthenticated users are redirected.
- **Firebase:** Configure `src/firebase.ts` for real data; otherwise the app runs with empty/offline behavior.

---

## Next Steps

1. **Backend:** Firebase is already wired; add security rules and more Firestore usage as needed.
2. **Auth:** `useAuth` uses Firebase Auth; extend for login page or other providers.
3. **Forms:** Category and Product forms use local state; optional: add `react-hook-form` and validation.
4. **Deploy:** Run `npm run build` and deploy the `dist/` output.

---

*This guide is adapted from the Passmartshop Admin Dashboard – Complete Implementation Guide for use in this repository.*
