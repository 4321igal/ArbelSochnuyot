# Storage image URL migration (signed URLs → keys)

## Problem
Signed S3/CloudFront URLs expire. Storing them in the DB or cart caused **AccessDenied** / **Request has expired** when the browser used an expired URL.

## Solution
- **Persist only object keys** in DB and cart (e.g. `images/products/<id>/main.jpg`, `images/categories/<id>/xxx.jpg`).
- **Resolve keys to fresh signed URLs at runtime** when rendering (single place: `getSignedUrl()` with in-memory cache).

## What changed

### Storage layer (`src/lib/api/storage.ts`)
- Upload functions return only `{ key }` (no `url`). Callers must persist **key** only.
- `getSignedUrl(key)` generates a 1-hour URL and caches it in memory for 50 minutes.
- `extractKeyFromS3Url(url)` helps migrate legacy DB rows that contain full S3 URLs (we try to extract the key and resolve a fresh URL).
- `getImageUrl()` is deprecated for display; it returns a placeholder for keys and S3-looking URLs so expired URLs are never shown. Use `StorageImage` or `useStorageImageUrl` for display.

### Display
- New **`StorageImage`** component and **`useStorageImageUrl`** hook resolve a key (or legacy URL) to a fresh signed URL and render an `<img>`.
- All product, category, and cart images now use `StorageImage` so they always get a fresh URL at render time.

### Persistence
- **Product.images**: array of **keys** only (admin form and manager save `uploaded.map(u => u.key)`).
- **Category.imageUrl**: stores the **key** after upload (field name unchanged; semantics are “image reference”).
- **Cart item.imageSnapshot**: stores the product image **key** (same as `product.images?.[0]`).

## Backward compatibility
- **Legacy DB rows** that still contain a full S3/CloudFront URL: `useStorageImageUrl` / `extractKeyFromS3Url` try to extract the object key from the URL and then call `getSignedUrl(extractedKey)`. If extraction fails, a placeholder is shown.
- **Migration**: For existing data with full URLs, you can run a one-off script to replace URLs with keys where the key can be parsed from the URL; otherwise mark those records for manual repair (e.g. re-upload image and save the new key).

## Files touched
- `src/lib/api/storage.ts` – uploads return key only; getSignedUrl + cache; extractKeyFromS3Url; getImageUrl deprecated.
- `src/hooks/useStorageImageUrl.ts` – new hook.
- `src/components/StorageImage.tsx` – new component.
- `src/pages/HomePage.tsx`, `ProductPage.tsx`, `CartPage.tsx` – category/product/cart images use StorageImage.
- `src/components/product/ProductCard.tsx` – StorageImage; addItem still passes key as `image`.
- `src/pages/admin/AdminProductForm.tsx`, `UnifiedAdminProducts.tsx`, `AdminProducts.tsx` – persist keys; display via StorageImage.
- `src/components/admin/CategoryFormModal.tsx` – persist upload `key` in category.imageUrl.
- `src/components/managerProduct/ManagerProduct.tsx`, `ProductGrid.tsx`, `ProductTable.tsx`, `EditProductModal.tsx` – persist key; display via StorageImage.

## Amplify
- No change to when `Amplify.configure()` runs; it remains at app startup before any Storage usage.
