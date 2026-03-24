# Performance Audit – Root Cause, Fixes, and Results

## 1. Root cause summary (top 5 issues)

| # | Issue | Impact |
|---|--------|--------|
| 1 | **No code splitting** – All pages (including heavy admin) were in the main bundle, so initial load downloaded AdminCategories, AdminProductForm, etc. | Large first-load JS; slow TTI on storefront and admin. |
| 2 | **Single large bundle** – No vendor/chunk splitting; React, React Router, and Amplify were in one big chunk. | No caching benefit; every deploy invalidated the whole app. |
| 3 | **Unnecessary re-renders** – ProductCard/ProductGrid and CartContext recomputed on every parent render; no memoization. | Extra work on scroll, filter, and cart updates. |
| 4 | **Sequential / duplicate requests** – Admin products page loaded categories then products in two effects; Search ran on every query change without debounce; getCategoryBySlug could pull all categories. | Slower perceived load and wasted API calls. |
| 5 | **Admin orders and category slug** – Orders loaded 100 at once with no pagination; category slug fallback did an unbounded list. | Heavy first load and risk of slow/expensive scans. |

---

## 2. Affected files

| File | Change |
|------|--------|
| `src/routes/lazy.tsx` | **New.** Lazy-loaded page components and `LazySuspense` + `PageFallback`. |
| `src/App.tsx` | Switched to lazy imports from `routes/lazy` and wrapped each route in `LazySuspense`. |
| `vite.config.ts` | `manualChunks`: vendor-react, vendor-router, vendor-lucide, vendor-amplify; `chunkSizeWarningLimit: 600`. |
| `src/components/product/ProductCard.tsx` | Wrapped in `React.memo` (export `ProductCard = memo(ProductCardInner)`). |
| `src/components/product/ProductGrid.tsx` | Wrapped in `React.memo`. |
| `src/lib/cart/CartContext.tsx` | `useMemo` for `items`, `itemCount`, `subtotal` (stable references). |
| `src/pages/admin/UnifiedAdminProducts.tsx` | Single effect: `Promise.all(listAllCategories, listProducts)` for initial/refresh; kept `loadProducts(token)` for “Load more”. |
| `src/pages/SearchPage.tsx` | 300 ms debounce on query before running search; cancel previous request on change. |
| `src/lib/api/products.ts` | `getCategoryBySlug` fallback capped to 200 categories (no full scan). |
| `src/pages/admin/AdminOrders.tsx` | Pagination: first page 25, “Load more” with `nextToken`; `loadOrders(token)`; Refresh uses `() => loadOrders()`. |

---

## 3. Exact code changes (summary)

- **Lazy routes:** All page components are `lazy(() => import(...))` and rendered inside `<LazySuspense>{children}</LazySuspense>` with a spinner fallback. Admin and protected routes load only when visited.
- **Vite chunks:** `manualChunks` by `id`: react/scheduler → `vendor-react`, react-router → `vendor-router`, lucide → `vendor-lucide`, aws-amplify / @aws-amplify → `vendor-amplify`.
- **ProductCard / ProductGrid:** Inner component + `export const ProductCard = memo(ProductCardInner)` (and same for ProductGrid).
- **CartContext:** `const items = useMemo(() => cart?.items ?? [], [cart?.items]);` and same for `itemCount` and `subtotal`.
- **UnifiedAdminProducts:** One `useEffect([status, searchDebounced])` that does `Promise.all([listAllCategories(...), listProducts(...)])` and sets categories, products, nextToken; `loadProducts` still used for “Load more” and refresh.
- **SearchPage:** `debouncedQuery` state updated 300 ms after `query`; search effect runs on `debouncedQuery` with cancellation.
- **getCategoryBySlug:** Fallback uses `Category.list({ limit: 200 })` and finds slug in memory (no unbounded list).
- **AdminOrders:** `PAGE_SIZE = 25`, `nextToken` state, `loadOrders(token)` for initial and “Load more”; Refresh button `onClick={() => loadOrders()}`.

---

## 4. Performance improvements expected

- **Initial load (storefront):** Only the route’s chunk (e.g. HomePage ~5 kB) plus vendor-react, vendor-router, and shared bits load first. Admin chunks (e.g. AdminCategories ~30 kB, UnifiedAdminProducts ~13 kB) are not loaded until admin is visited. **Rough expectation: first-load JS down ~40–50% for a storefront-only visit; TTI improvement on the order of 1–2 s on slow networks.**
- **Navigation:** Lazy routes mean product/category/admin pages load on demand; repeat visits use cached chunks.
- **Admin products screen:** One parallel request for categories + first page instead of two sequential; single loading state. **Faster first paint and fewer round-trips.**
- **Search:** Debounce and request cancellation reduce redundant calls when the user types quickly. **Fewer API calls and less UI thrash.**
- **Admin orders:** First page 25 rows; “Load more” on demand. **Faster first paint and less data over the wire.**
- **Re-renders:** Memo on ProductCard/ProductGrid and stable CartContext values reduce work during scroll and cart updates. **Smoother lists and cart UI.**

---

## 5. Optional / low-priority improvements

- **Circular chunk warning:** Build reports `Circular chunk: vendor-amplify -> vendor-react -> vendor-amplify`. You can merge into a single `vendor` chunk to remove it at the cost of a larger initial vendor bundle.
- **Search backend:** Search still uses `listProducts(50)` + client-side filter. For large catalogs, move to server-side search (e.g. OpenSearch or DynamoDB filter expression) and keep debounce.
- **Image thumbnails:** List views use full-size images via StorageImage. Adding a “thumb” variant (smaller key or resize params) would reduce bandwidth in grids.
- **getProductCountByCategoryMap:** Still scans all products in a loop; consider a dedicated count API or cached counts if categories are heavy.
- **Auth:** `checkAuth` could run `fetchUserAttributes` and `fetchAuthSession` in parallel after `getCurrentUser` to slightly reduce auth latency.

---

## Amplify configuration

- `configureAmplify()` is called in `main.tsx` before `ReactDOM.createRoot(...).render(...)`, so Amplify is configured before any component (including CartProvider/AuthProvider) runs. No change was required for the “Amplify has not been configured” issue.
