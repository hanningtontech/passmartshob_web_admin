# Prompt: Update the user-facing shop (passmartshop_web) to match the admin

Use this prompt when updating the customer-facing shop so it correctly reads and displays data created or updated by the Passmartshop admin app.

---

## Copy this prompt for your user web / shop project

**Context:** We have an admin app (passmartshob_web_admin) that manages categories and products. It writes to **Firebase Firestore** and stores product images as URLs (from Firebase Storage, Backblaze B2, or pasted URLs). Update the **user-facing shop** (passmartshop_web or equivalent) so it stays in sync with the admin.

**Requirements:**

1. **Firebase**
   - The shop must use the **same Firebase project** as the admin (same `projectId` and config).
   - Read-only from Firestore collections: **`categories`** and **`products`**.
   - Do not write to these collections from the shop; the admin is the single source of writes.

2. **Categories (Firestore `categories`)**
   - Each document has: **`name`**, **`slug`**, **`description`**, **`displayOrder`** (number), **`active`** (boolean), **`parentId`** (string | null – null for root categories; set for subcategories so you can build a tree), **`updatedAt`**, **`createdAt`** (Firestore timestamps).
   - Document IDs: root categories use **slug** (e.g. `grocery`, `home-kitchen`); subcategories use UUIDs.
   - The admin seeds 18 root categories (Grocery, Home & Kitchen, Electronics & Appliances, etc.). Products are assigned a **root** category via **`categoryId`**. Subcategories are for organization only; the shop can optionally show a category tree using **`parentId`**.
   - The shop should list/filter categories by `displayOrder`, use `active` to hide inactive ones, and use `slug` for URLs or routing where appropriate.

3. **Products (Firestore `products`)**
   - Each document has:
     - **`name`**, **`description`** (Markdown: paragraphs, **bold**, ## headings, - lists; render as Markdown on the product page), **`categoryId`** (references a category doc id)
     - **`price`** (number) and **`basePrice`** (number) – use either for display price
     - **`compareAtPrice`** (number | null) and **`originalPrice`** (string | null) – for “was / compare at” pricing
     - **`stockCount`** (string, e.g. `"0"`)
     - **`isNew`** (boolean), **`featured`** (boolean), **`inStock`** (boolean)
     - **`images`** (array of strings) – each string is a **full image URL** (no extra auth needed to display)
     - **`tags`** (optional array of strings) – search keywords (e.g. `["wireless", "bluetooth"]`). Use with category names to improve search.
     - **`subProducts`** (optional array): `{ id, name, sku, price, stockCount }` for **product variants** – must be visible on the product detail page (e.g. table or list of options).
     - **`updatedAt`**, **`createdAt`** (Firestore timestamps)
   - The shop should display product images from **`product.images`** as normal `<img src={url} />` – URLs may be from Firebase Storage, Backblaze B2 (`https://….backblazeb2.com/…`), or any other URL; treat them all the same.
   - **Product description:** Stored as **Markdown** (paragraphs, `##` headings, `-` bullet lists, `**bold**`). On the product detail page, render `product.description` with a Markdown renderer (e.g. `react-markdown`) so customers see structured content with headings, lists, and bold—not one plain paragraph.
   - Support **`compareAtPrice`** / **`originalPrice`** to show strikethrough “was” price when present.
   - Use **`featured`** and **`isNew`** for badges or filters; use **`inStock`** to show availability or hide out-of-stock.
   - **Product variants:** Show **`product.subProducts`** on the product detail page so customers see all variants (name, SKU, price, stock). Display as a table, list, or option selector—do not hide variants from the user view.

4. **Product images**
   - Product images are stored only as URLs in **`product.images`** (string array). The admin may upload to:
     - Firebase Storage (URLs like `https://firebasestorage.googleapis.com/…`)
     - Backblaze B2 (URLs like `https://<bucket>.s3.<region>.backblazeb2.com/…`)
     - Or paste any public image URL.
   - The shop should **only** use these URLs to render images; no server-side or client-side upload logic is needed. Ensure CORS or img loading allows these domains if you have strict CSP.

5. **Multiple images per product (guide for the shop)**
   - Use **only** that product’s **`product.images`** array – do not mix with other products.
   - **Listing/cards:** Use the first image as the thumbnail (`product.images[0]`), with a fallback if the array is empty.
   - **Product page:** Show all of `product.images` (gallery, carousel, or grid); order = admin order.
   - **`product.images`** is an array of URLs (max 10); no extra API calls.

6. **Store behaviour: product description**
   - **`product.description`** is **Markdown**. On the product page, render it with a **Markdown renderer** (e.g. `react-markdown`) so customers see **headings, lists, and bold** instead of one plain paragraph.

7. **Search (categories, subcategories, and tags)**
   - **Use categories and subcategories as search tags:** When building search (e.g. search bar or filters), include not only product name and description but also:
     - The **category name** for the product (resolve `product.categoryId` to the category doc and use its `name`).
     - If you have the category tree, include **subcategory names** in the path (e.g. Grocery → Fresh Produce → Fruits) as searchable terms.
   - **Use the `tags` field:** Include **`product.tags`** (array of strings) in the search index or query so keywords like "wireless", "bluetooth" match products that have those tags.
   - Combined, search should consider: **name**, **description**, **tags**, **category name**, and **category path (subcategories)** so customers find products by category or keyword.

8. **Optional**
   - If the shop has types or interfaces for Product/Category, align them with the field names above (e.g. `categoryId`, `basePrice`, `compareAtPrice`, `images`, `tags`, `subProducts`, `displayOrder`, `active`).
   - Order products/categories consistently with the admin (e.g. by `createdAt` or a sort field if you add one later).

**Summary:** Connect the shop to the same Firebase project; read `categories` and `products`; display **product variants** (`subProducts`) on the product page; display product images from the `images` array; render **product.description** as Markdown; use **categories, subcategories, and product.tags** for search so the store search is effective.
