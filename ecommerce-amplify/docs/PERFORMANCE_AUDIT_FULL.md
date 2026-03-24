# Full Performance Audit – Diagnosis, Before Table, Fixes, After Summary

## 1. Concise diagnosis

The app was slow because:

- **Initial JS and CSS** included all routes (including heavy admin) and Amplify UI styles up front, so the first load was larger than necessary.
- **Home** was fetching the full category tree (`listAllCategories`) then filtering to top-level only, causing extra data and work.
- **Admin products** (AdminProducts.tsx) recreated `loadProducts` every render and had unstable effect dependencies, risking duplicate or unnecessary fetches.
- **Images** had no explicit dimensions, contributing to layout shift (CLS) and slower perceived load.
- **Amplify** configuration order was correct but not documented, making “Amplify has not been configured” harder to reason about.

Existing good patterns (from prior work) already in place: route-level code splitting, vendor chunks, memoized ProductCard/ProductGrid, CartContext useMemo, UnifiedAdminProducts parallel load, SearchPage debounce, AdminOrders pagination, getCategoryBySlug cap, S3 key-based storage with runtime signed URLs.

---

## 2. Before table

| Area | File/Page | Problem | Impact | Priority | Fix strategy |
|------|-----------|--------|--------|----------|--------------|
| Bundle | App.tsx | `@aws-amplify/ui-react/styles.css` loaded in main bundle | Larger initial CSS; Amplify UI styles on every route | Medium | Defer: move import to AuthPage (lazy chunk) |
| Network | HomePage | `listCategories()` → `listAllCategories()` fetches all categories | Extra API round-trips and payload when only top-level needed | High | Add `listTopLevelCategories(limit)`, single capped request |
| Frontend | AdminProducts.tsx | `loadProducts` not in useCallback; effect deps on [filter] only; location.state effect re-runs often | Unnecessary effect runs and possible duplicate/race fetches | High | useCallback(loadProducts, [filter]); stable effect deps |
| Images | StorageImage | No width/height/sizes | CLS, slower LCP, no decoding hint | Medium | Optional width, height, sizes, decoding="async" |
| AWS/Amplify | main.tsx | Amplify init order not documented | Risk of using Amplify before configure | Low | Comment that configure must run before any Amplify API |

---

## 3. Files changed

| File | Change summary |
|------|----------------|
| `src/App.tsx` | Removed global `import '@aws-amplify/ui-react/styles.css'` (kept in AuthPage). |
| `src/main.tsx` | Added comment that Amplify must be configured before any Amplify API. |
| `src/lib/api/products.ts` | Added `listTopLevelCategories(limit)`; HomePage uses it. |
| `src/pages/HomePage.tsx` | Switched to `listTopLevelCategories(20)` + `Promise.all` with featured products; removed client-side filter/sort (done in API). |
| `src/components/StorageImage.tsx` | Added optional `width`, `height`, `sizes`, and `decoding="async"`. |
| `src/pages/admin/AdminProducts.tsx` | Wrapped `loadProducts` in `useCallback([filter])`; effects depend on `loadProducts` or `[location.state, loadProducts]`. |
| `docs/PERFORMANCE_AUDIT_FULL.md` | This document. |

---

## 4. Code changes

### 4.1 `src/App.tsx`

- **Before:** `import '@aws-amplify/ui-react/styles.css';` at top.
- **After:** Removed. Amplify UI styles remain in `src/pages/AuthPage.tsx` (lazy chunk), so they load only when the auth page is visited.

### 4.2 `src/main.tsx`

- **Added:** Comment before `configureAmplify()`:
  - “Amplify must be configured once before any Amplify API (Auth, Data, Storage) is used. Do not import or render components that use Amplify before this line.”

### 4.3 `src/lib/api/products.ts`

- **Added:** After `listCategories()`:

```ts
/**
 * List top-level categories only (parentId null/absent). Single request, capped – use for home/nav.
 */
export async function listTopLevelCategories(limit = 30): Promise<Category[]> {
  const { data } = await client.models.Category.list({
    filter: { isActive: { eq: true } },
    limit: Math.min(limit * 2, 100),
  });
  const mapped = (data || []).map(mapCategory).filter((c) => !c.isDeleted && !c.parentId);
  return mapped
    .slice(0, limit)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}
```

### 4.4 `src/pages/HomePage.tsx`

- **Before:** `listCategories()` then `cats.filter((c) => !c.parentId).sort(...)`.
- **After:** `listTopLevelCategories(20)` in `Promise.all` with `listFeaturedProducts(8)`; set categories directly (no client-side filter/sort).

### 4.5 `src/components/StorageImage.tsx`

- **Added props:** `width?: number`, `height?: number`, `sizes?: string`.
- **Added on `<img>`:** `width={width}`, `height={height}`, `sizes={sizes}`, `decoding="async"`.

### 4.6 `src/pages/admin/AdminProducts.tsx`

- **Before:** `const loadProducts = async (token?: string) => { ... };` and `useEffect(() => { setSelectedIds(new Set()); loadProducts(); }, [filter]);` plus a second effect with `[location.state]` calling `loadProducts()`.
- **After:** `const loadProducts = useCallback(async (token?: string) => { ... }, [filter]);` then:
  - `useEffect(() => { setSelectedIds(new Set()); loadProducts(); }, [loadProducts]);`
  - `useEffect(() => { ...; const t = setTimeout(() => loadProducts(), 600); return () => clearTimeout(t); }, [location.state, loadProducts]);`

---

## 5. After summary

- **Initial load:** Smaller initial CSS (Amplify UI styles only when auth chunk loads). Home fetches one capped category request instead of full tree.
- **Admin responsiveness:** AdminProducts has stable `loadProducts` and effect dependencies, reducing duplicate/raced requests.
- **API efficiency:** Home uses a single capped `listTopLevelCategories(20)` instead of pulling all categories.
- **Image loading:** StorageImage supports dimensions and `decoding="async"` to reduce CLS and improve LCP when callers pass width/height.
- **Bundle weight:** Slight reduction in main bundle by deferring Amplify UI CSS; HomePage chunk marginally smaller with listTopLevelCategories.

---

## 6. Expected impact

- **Fewer requests:** Home: one category request with bounded size instead of paginating through all categories.
- **Smaller initial payload:** No Amplify UI CSS in the critical path until user hits /auth.
- **Faster route render:** Home resolves categories with less data and no client-side filter/sort.
- **Better perceived performance:** Optional width/height on images reduce layout shift; AdminProducts avoids redundant fetches from unstable deps.

---

## 7. Low-priority next steps

- **ProductCard / ProductGrid:** Pass `width` and `height` (e.g. 400 for list cards) into `StorageImage` where layout is known.
- **listTopLevelCategories:** If the backend supports filtering by `parentId` null/absent, use it so one request returns only roots without over-fetching.
- **Circular chunk warning:** If desired, merge vendor-amplify and vendor-react into one vendor chunk to remove the Rollup circular-chunk warning (trade-off: larger single vendor bundle).
- **AdminCategories / getProductCountByCategoryMap:** Still scans products for counts; consider a dedicated count API or cached counts if the admin categories list is slow at scale.
- **Search:** Still client-side filter over a limited product list; for large catalogs, move to server-side search and keep debounce.

---

## Amplify “has not been configured” check

- **Root cause:** The error occurs if any Amplify API (Auth, Data, Storage) is used before `Amplify.configure()` runs.
- **Current behavior:** `main.tsx` calls `configureAmplify()` synchronously before `ReactDOM.createRoot(...).render(...)`. No component runs before that. The Data client is first used when `CartProvider` (or another component that imports `client`) mounts, which is after configuration.
- **Fix:** No code change required. Comment in `main.tsx` documents that configuration must run before any Amplify API and that components must not use Amplify before that line. Admin and other routes use Amplify only after the app has mounted and configuration has run.
