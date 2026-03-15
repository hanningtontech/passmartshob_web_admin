# Storefront update: Clickable variants (per-variant images & specs)

Use this when updating the **user-facing shop** so that variants are clickable and each variant shows its own images and specs.

---

## What changed in the admin

- Each **variant** (subProduct) can now have:
  - **`images`** – array of image URLs (variant-specific gallery)
  - **`description`** – optional Markdown (variant-specific specs/notes)
- Product-level **`images`** and **`description`** still exist; use them when the product has no variants or as fallback.

---

## Data shape (Firestore)

Each item in **`product.subProducts`** can look like:

```ts
{
  id: string
  name: string
  sku: string
  price: string
  stockCount: string
  images?: string[]      // NEW – variant images (use when this variant is selected)
  description?: string   // NEW – Markdown (show when this variant is selected)
}
```

---

## What to do on the storefront

1. **Product detail page**
   - If the product has **no** `subProducts` (or empty array):
     - Show product **`images`** and **`description`** as you do now.
   - If the product **has** `subProducts`:
     - Show variants as **clickable options** (e.g. buttons, tabs, or a selector by variant name).
     - **Initial state:** Select the first variant by default (or “main” product if you prefer).
     - **When the user clicks a variant:**
       - Switch the main content to that variant:
         - **Images:** Use **`variant.images`** if it exists and has length; otherwise fall back to **`product.images`**.
         - **Price / stock:** Use **`variant.price`** and **`variant.stockCount`** (and show “In stock” / “Out of stock” from stockCount or product logic).
         - **Description / specs:** Use **`variant.description`** if present (render as Markdown); otherwise use **`product.description`**.
       - Optionally show variant **name** and **SKU** (e.g. under the title or in a specs block).

2. **Add to cart**
   - When the user adds to cart, send the **selected variant** (e.g. `variant.id` or full variant object) so the cart and checkout show the correct variant name, SKU, price, and image.

3. **Thumbnails / listing**
   - For product cards or listing thumbnails, you can keep using **`product.images[0]`** or, if you want to reflect the “first” variant, use **`product.subProducts[0].images?.[0]`** if present, else **`product.images[0]`**.

---

## Summary

- Variants are **clickable**; selecting one updates the product detail to that variant’s **images**, **price**, **stock**, and **description**.
- Each variant behaves like a **mini product** inside the same product (own images + specs).
- Cart/checkout must store and display the **selected variant** (id, name, sku, price, image).
