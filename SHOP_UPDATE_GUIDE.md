# User guide: Update the storefront (passmartshop_web) to match the admin

This guide is for developers or teams updating the **user-facing shop** so it shows product variants, uses categories and tags for search, and stays in sync with the admin app.

---

## 1. Product variants (subProducts) – visible in user view

**What:** Products can have **variants** (e.g. size, color, model). The admin saves them in **`product.subProducts`**.

**Data:** Each variant has: `id`, `name`, `sku`, `price`, `stockCount` (strings).

**What to do on the shop:**

- On the **product detail page**, show **`product.subProducts`** so customers can see all options.
- Display them as:
  - a **table** (columns: Name, SKU, Price, Stock), or
  - a **list** of options, or
  - a **selector** (e.g. dropdown or buttons) if the customer picks one variant.
- Do **not** hide variants; they must be visible in the user view.

**Example (conceptual):**

```text
Variants:
- Model A — SKU 001 — $29.99 — In stock
- Model B — SKU 002 — $34.99 — In stock
```

---

## 2. Categories and subcategories – use as tags for search

**What:** Categories and subcategories (the tree from the admin) should be used as **search tags** so customers can find products by category name or path.

**What to do on the shop:**

- When building **search** (search bar or filters):
  - Resolve **`product.categoryId`** to the category document and use its **`name`** in search.
  - If you load the category tree (using **`parentId`**), build the full path (e.g. Grocery → Fresh Produce → Fruits) and include **all names in that path** as searchable terms.
- So a search for “Grocery” or “Fruits” can match a product whose category (or parent chain) contains that name.

**Data:** Categories have **`name`**, **`slug`**, **`parentId`** (null for root). Subcategories have **`parentId`** set to the parent category id.

---

## 3. Tags field – enhance search

**What:** Each product can have a **`tags`** field: an array of strings (e.g. `["wireless", "bluetooth", "portable"]`). The admin can set these in the product form (comma‑separated).

**What to do on the shop:**

- Include **`product.tags`** in your search logic.
- When the user types a search query, match against:
  - product **name**
  - product **description**
  - product **tags**
  - **category name** (and subcategory path, if you have it)

This makes search more accurate and allows finding products by keywords that are not in the title or description.

---

## 4. Checklist for the storefront

| Item | Where | Action |
|------|--------|--------|
| **Variants** | Product detail page | Show `product.subProducts` (table, list, or selector). |
| **Categories as search tags** | Search / filters | Resolve `categoryId` to category name; include category and subcategory path in search. |
| **Tags in search** | Search / filters | Include `product.tags` in the search index or query. |
| **Tags in data** | Product type / Firestore | Add **`tags`** (array of strings) to the product type and any search index. |
| **Description** | Product detail page | Render **`product.description`** as Markdown (headings, lists, bold). |
| **Images** | Product listing & detail | Use **`product.images`** only for that product (gallery on detail, first image on cards). |

---

## 5. Full prompt for the shop

For a complete, copy-paste specification of Firestore fields and behaviour, use **`USER_WEB_UPDATE_PROMPT.md`** in this repo. It contains the full requirements for Firebase, categories, products, images, variants, tags, and search so the storefront stays in sync with the admin.

---

## Quick reference – product fields used on the shop

- **name**, **description** (Markdown), **categoryId**
- **price**, **basePrice**, **compareAtPrice**, **originalPrice**
- **stockCount**, **inStock**, **isNew**, **featured**
- **images** (array of URLs)
- **tags** (array of strings – for search)
- **subProducts** (array of variants – **must be visible** on product page)

Categories: **name**, **slug**, **parentId**, **displayOrder**, **active**.
