# Unified Admin Products Architecture

תכנון לאיחוד AdminProducts ו-ManagerProduct למערכת ניהול מוצרים מאוחדת אחת.

---

## 1. PROPOSED FINAL ROUTE MAP

```
/admin/products                    → UnifiedAdminProducts (main screen)
  ├── /admin/products/new          → AdminProductForm (create)
  └── /admin/products/:id/edit     → AdminProductForm (edit)

DELETE:
  ❌ /admin/manager-product         → Remove (merged into /admin/products)
```

**Route Access:**
- `/admin/products` (all views): **Any authenticated user** (AdminRoute allows `/admin/products/*`)
- `/admin/products/new` and `/admin/products/:id/edit`: **Any authenticated user**
- **UI gating:** Admin-only features (hard delete, restore, CSV import, Deleted view) hidden/shown based on `isAdmin`

---

## 2. COMPONENT ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        UnifiedAdminProducts (Main)                       │
│  /admin/products                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  HeaderSection                                                  │   │
│  │  - Title, stats (total/active/inactive/deleted counts)          │   │
│  │  - Actions: + Add Product, Import CSV (admin only)              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  FilterTabs                                                     │   │
│  │  - Active | Inactive | Deleted (admin only) | All (optional)    │   │
│  │  - SearchBar (title/SKU/category)                              │   │
│  │  - ViewModeToggle: Table | Grid (optional)                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  BulkActionsBar (shown when selection > 0)                      │   │
│  │  - Bulk Toggle Active/Inactive                                  │   │
│  │  - Bulk Soft Delete                                              │   │
│  │  - Bulk Restore (admin only, Deleted view only)                  │   │
│  │  - Bulk Permanent Delete (admin only, Deleted view only)          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ProductTable / ProductGrid                                     │   │
│  │  - Columns: checkbox, image, title, category, price, stock,      │   │
│  │    status, actions (inline edit, full edit, delete/restore)      │   │
│  │  - InlineEditCell: price, stock, active toggle, category        │   │
│  │  - Row actions: Edit (full), Delete/Restore, PermaDelete (admin) │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Pagination / LoadMore                                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ├─── Shared Components/Hooks
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ AdminProduct  │   │ Category      │   │ CSV Import    │
│ Form          │   │ Management    │   │               │
│ (Modal/Route) │   │               │   │               │
│               │   │               │   │               │
│ - Full form   │   │ - AddCategory │   │ - useCSVImport│
│ - Image upload│   │   Modal       │   │ - ImportCSV  │
│ - AI Enrich   │   │ - listAll     │   │   Modal      │
│ (admin only)  │   │   Categories  │   │               │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Shared Hooks    │
                    ├─────────────────┤
                    │ useProducts     │
                    │ useCategories   │
                    │ useBulkActions  │
                    │ useInlineEdit   │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  API Layer       │
                    │  products.ts     │
                    │  - listProducts  │
                    │  - softDelete    │
                    │  - restore       │
                    │  - hardDelete    │
                    └─────────────────┘
```

**Shared Components (reused from ManagerProduct):**
- `ProductGrid`, `ProductTable` (with inline edit support)
- `SearchBar`, `StatsSection` (adapted)
- `AddCategoryModal` (from ManagerProduct)
- `ImportCSVModal` + `useCSVImport` hook
- `ErrorBoundary` (wrap UnifiedAdminProducts)

**New Components:**
- `UnifiedAdminProducts` (main container)
- `FilterTabs` (Active/Inactive/Deleted/All)
- `BulkActionsBar`
- `InlineEditCell` (price, stock, active, category)
- `ProductRowActions` (Edit, Delete/Restore, PermaDelete)

---

## 3. DATA/API CONTRACT CHANGES

### 3.1 Schema Changes (amplify/data/resource.ts)

**Add to Product model:**
```typescript
Product: a.model({
  // ... existing fields ...
  deletedAt: a.datetime(),           // Soft delete timestamp
  deletedBy: a.string(),              // userId who deleted
  deleteReason: a.string(),            // Optional reason
  // ... rest ...
})
```

**Authorization:**
- `deletedAt` field: Only Admin can read/write
- Regular users: Filtered out automatically in `listProducts` (unless `includeDeleted: true`)

### 3.2 API Functions (src/lib/api/products.ts)

**Update `listProducts`:**
```typescript
export async function listProducts(
  options?: PaginationOptions & {
    categoryId?: string;
    brand?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    includeDeleted?: boolean;        // NEW: admin only
    status?: 'active' | 'inactive' | 'deleted' | 'all';  // NEW
    search?: string;                  // NEW: search title/SKU
  }
): Promise<PaginatedResult<Product>> {
  const filter: Record<string, unknown> = {};
  
  // Status filter (replaces isActive)
  if (options?.status === 'active') {
    filter.isActive = { eq: true };
    filter.deletedAt = { attributeExists: false };  // Not deleted
  } else if (options?.status === 'inactive') {
    filter.isActive = { eq: false };
    filter.deletedAt = { attributeExists: false };
  } else if (options?.status === 'deleted') {
    filter.deletedAt = { attributeExists: true };   // Only deleted
  } else if (options?.status !== 'all' && !options?.includeDeleted) {
    // Default: exclude deleted unless explicitly included
    filter.deletedAt = { attributeExists: false };
  }
  
  // ... rest of filters ...
  
  // Search (if provided) - client-side filter or backend if GSI exists
  // For MVP: filter in memory after fetch
}
```

**New Functions:**
```typescript
/**
 * Soft delete product (sets deletedAt, deletedBy)
 */
export async function softDeleteProduct(
  id: string, 
  reason?: string
): Promise<Product> {
  const { userId } = await getCurrentUser(); // From auth
  const { data, errors } = await client.models.Product.update({
    id,
    deletedAt: new Date().toISOString(),
    deletedBy: userId,
    deleteReason: reason || undefined,
  });
  if (errors || !data) throw new Error('Failed to soft delete');
  return mapProduct(data);
}

/**
 * Restore soft-deleted product (clears deletedAt, deletedBy, deleteReason)
 */
export async function restoreProduct(id: string): Promise<Product> {
  const { data, errors } = await client.models.Product.update({
    id,
    deletedAt: undefined,
    deletedBy: undefined,
    deleteReason: undefined,
  });
  if (errors || !data) throw new Error('Failed to restore');
  return mapProduct(data);
}

/**
 * Hard delete (permanent) - Admin only, backend enforces
 */
export async function hardDeleteProduct(id: string): Promise<void> {
  const { errors } = await client.models.Product.delete({ id });
  if (errors) throw new Error('Failed to hard delete');
}

/**
 * Bulk operations
 */
export async function bulkSoftDelete(ids: string[], reason?: string): Promise<void> {
  await Promise.all(ids.map(id => softDeleteProduct(id, reason)));
}

export async function bulkRestore(ids: string[]): Promise<void> {
  await Promise.all(ids.map(id => restoreProduct(id)));
}

export async function bulkToggleActive(ids: string[], isActive: boolean): Promise<void> {
  await Promise.all(ids.map(id => updateProduct(id, { isActive })));
}

export async function bulkHardDelete(ids: string[]): Promise<void> {
  await Promise.all(ids.map(id => hardDeleteProduct(id)));
}
```

**Update `deleteProduct` (backward compatibility):**
```typescript
/**
 * Delete product - defaults to soft delete for admin, hard delete for backward compat
 * @deprecated Use softDeleteProduct or hardDeleteProduct explicitly
 */
export async function deleteProduct(id: string, hard = false): Promise<void> {
  if (hard) {
    await hardDeleteProduct(id);
  } else {
    await softDeleteProduct(id);
  }
}
```

**Update `mapProduct`:**
```typescript
function mapProduct(data: unknown): Product {
  const p = data as Record<string, unknown>;
  return {
    // ... existing fields ...
    deletedAt: p.deletedAt as string | null,
    deletedBy: p.deletedBy as string | null,
    deleteReason: p.deleteReason as string | null,
  };
}
```

**Update Product interface:**
```typescript
export interface Product {
  // ... existing fields ...
  deletedAt?: string | null;
  deletedBy?: string | null;
  deleteReason?: string | null;
}
```

---

## 4. UI SPEC FOR /admin/products

### 4.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Header                                                      │
│ - Title: "Products"                                         │
│ - Stats: Total: 150 | Active: 120 | Inactive: 20 | Deleted: 10 (admin) │
│ - Actions: [+ Add Product] [Import CSV] (admin)             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Filter Tabs                                                 │
│ [Active] [Inactive] [Deleted] (admin) [All]                │
│                                                             │
│ Search: [________________] (title/SKU/category)            │
│ View: [Table] [Grid] (optional)                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Bulk Actions Bar (shown when selection > 0)                 │
│ Selected: 3 products                                        │
│ [Toggle Active] [Soft Delete] [Restore] (admin, Deleted)    │
│ [Permanent Delete] (admin, Deleted)                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Product Table                                               │
│ ┌─────┬────────┬──────────┬───────┬────────┬────────┬────┐│
│ │ ☑   │ Product│ Category │ Price │ Stock  │ Status │Actions││
│ ├─────┼────────┼──────────┼───────┼────────┼────────┼────┤│
│ │ ☑   │ [img]  │ [select] │ [edit]│ [edit] │ [toggle]│ ... ││
│ │     │ Title  │ Category │ ₪100  │ 50     │ Active │Edit││
│ │     │ SKU    │          │       │        │        │Del ││
│ └─────┴────────┴──────────┴───────┴────────┴────────┴────┘│
│                                                             │
│ [Load More] (if nextToken exists)                          │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Table Columns

| Column | Type | Editable | Notes |
|--------|------|----------|-------|
| **Checkbox** | - | - | Select for bulk actions |
| **Product** | Image + Title + SKU | - | Image thumbnail, title link to edit, SKU below |
| **Category** | Select dropdown | ✅ Inline | Quick change category |
| **Price** | Number input | ✅ Inline | ₪ prefix, 2 decimals |
| **Stock** | Number input | ✅ Inline | Color: red (0), yellow (≤5), green (>5) |
| **Status** | Toggle badge | ✅ Inline | Active (green) / Inactive (red) |
| **Actions** | Buttons | - | Edit (full), Delete/Restore, PermaDelete (admin, Deleted view) |

### 4.3 Row Actions (per product)

**Active/Inactive views:**
- **Edit** → `/admin/products/:id/edit` (full form modal or route)
- **Delete** → Soft delete (confirmation dialog with optional reason)

**Deleted view (admin only):**
- **Restore** → Restore product
- **Permanent Delete** → Hard delete (confirmation: "This cannot be undone")

### 4.4 Bulk Actions

**Active/Inactive views:**
- **Toggle Active** → Bulk update `isActive`
- **Soft Delete** → Bulk soft delete (confirmation + optional reason)

**Deleted view (admin only):**
- **Restore** → Bulk restore
- **Permanent Delete** → Bulk hard delete (confirmation: "Permanently delete X products?")

### 4.5 Inline Edit Behavior

- **Click cell** → Enter edit mode (input/select appears)
- **Blur/Save** → Auto-save via `updateProduct` (optimistic update)
- **Error** → Show toast, revert value
- **Loading** → Show spinner in cell

### 4.6 Search

- **Scope:** Title, SKU, Category name
- **Implementation:** Client-side filter (for MVP) or backend GSI if needed
- **Debounce:** 300ms

---

## 5. MIGRATION PLAN

### Phase 1: Schema & API (Backend)

1. **Update Product schema:**
   - Add `deletedAt`, `deletedBy`, `deleteReason` to `amplify/data/resource.ts`
   - Deploy schema changes (`npx ampx sandbox` or deploy)

2. **Update API functions:**
   - Add `softDeleteProduct`, `restoreProduct`, `hardDeleteProduct` to `products.ts`
   - Update `listProducts` to support `status` and `includeDeleted`
   - Update `deleteProduct` to default to soft delete (or deprecate)
   - Add bulk operations

3. **Test API:**
   - Verify soft delete sets `deletedAt`
   - Verify `listProducts` excludes deleted by default
   - Verify restore clears `deletedAt`
   - Verify hard delete removes record

### Phase 2: Shared Components & Hooks

4. **Extract shared components:**
   - Move `ProductGrid`, `ProductTable` from `managerProduct/` to `components/product/` (if not already)
   - Create `useProducts` hook (encapsulates `listProducts` with status filter)
   - Create `useCategories` hook (cached `listAllCategories`)
   - Create `useBulkActions` hook (bulk operations + toast notifications)
   - Create `useInlineEdit` hook (inline edit state + save)

5. **Create new components:**
   - `FilterTabs` (Active/Inactive/Deleted/All)
   - `BulkActionsBar`
   - `InlineEditCell` (reusable for price/stock/category/active)
   - `ProductRowActions` (Edit, Delete/Restore, PermaDelete)

### Phase 3: Unified Component

6. **Create `UnifiedAdminProducts`:**
   - Replace `AdminProducts.tsx` with new unified component
   - Integrate FilterTabs, BulkActionsBar, ProductTable
   - Add inline edit support
   - Add search
   - Add ErrorBoundary wrapper

7. **Update routes:**
   - Keep `/admin/products/new` → `AdminProductForm`
   - Keep `/admin/products/:id/edit` → `AdminProductForm`
   - Update `AdminRoute` to allow `/admin/products/*` for all authenticated users
   - **Remove** `/admin/manager-product` route (or redirect to `/admin/products`)

### Phase 4: Permissions & UI Gating

8. **Add RBAC checks:**
   - Hide "Deleted" tab if `!isAdmin`
   - Hide "Import CSV" button if `!isAdmin`
   - Hide "Permanent Delete" actions if `!isAdmin`
   - Hide "Restore" if `!isAdmin` or not in Deleted view
   - Disable bulk hard delete if `!isAdmin`

9. **Update AdminProductForm:**
   - Show "AI Enrich" button only if `isAdmin` (or keep for all - state decision)
   - Ensure categories are required on save

### Phase 5: Cleanup

10. **Remove old code:**
    - Delete `ManagerProduct.tsx` (or keep as deprecated redirect)
    - Remove `/admin/manager-product` route from `App.tsx`
    - Update `AdminLayout` sidebar (remove "Manager Product" nav item)

11. **Update documentation:**
    - Update `ARCHITECTURE.md` with new routes
    - Document soft delete model

### Phase 6: Testing & Verification

12. **Test scenarios:**
    - Admin: All tabs visible, all actions work
    - Regular user: No Deleted tab, no hard delete, no CSV import
    - Soft delete: Product disappears from Active/Inactive, appears in Deleted
    - Restore: Product moves back to Active/Inactive
    - Hard delete: Product permanently removed
    - Bulk actions: All work correctly
    - Inline edit: Auto-saves correctly
    - Search: Filters correctly

---

## 6. SECURITY CHECKLIST FOR RBAC ENFORCEMENT

### 6.1 Backend Authorization (Amplify Schema)

- ✅ **Product.delete():** Only Admin group (`allow.group('Admin').to(['delete'])`)
- ✅ **Product.update():** Authenticated users can update; Admin has full access
- ✅ **deletedAt field:** Admin-only read/write (add field-level auth if Amplify supports)
- ✅ **listProducts with includeDeleted:** Backend filter enforces Admin-only (or filter in API layer)

### 6.2 API Layer (src/lib/api/products.ts)

- ✅ **softDeleteProduct:** Check `isAdmin` before allowing (or rely on backend auth)
- ✅ **restoreProduct:** Check `isAdmin` before allowing
- ✅ **hardDeleteProduct:** Check `isAdmin` before allowing
- ✅ **bulkHardDelete:** Check `isAdmin` before allowing
- ✅ **listProducts with status='deleted':** Check `isAdmin` before including deleted

**Implementation:**
```typescript
import { useAuth } from '../auth/AuthContext';

export async function hardDeleteProduct(id: string): Promise<void> {
  // Backend enforces Admin-only via schema, but add explicit check for clarity
  const { isAdmin } = useAuth(); // Or pass as param
  if (!isAdmin) throw new Error('Admin only');
  // ... rest
}
```

### 6.3 UI Gating (Components)

- ✅ **FilterTabs:** Hide "Deleted" tab if `!isAdmin`
- ✅ **BulkActionsBar:** Hide "Restore" and "Permanent Delete" if `!isAdmin` or not in Deleted view
- ✅ **ProductRowActions:** Hide "Permanent Delete" if `!isAdmin` or not in Deleted view
- ✅ **Header:** Hide "Import CSV" button if `!isAdmin`
- ✅ **AdminProductForm:** Hide "AI Enrich" if `!isAdmin` (or show for all - decision needed)

### 6.4 Route Protection (AdminRoute)

- ✅ **Current:** `/admin/products/*` allowed for all authenticated users
- ✅ **UI gating:** Features hidden/shown based on `isAdmin` from `useAuth()`
- ✅ **Backend:** Schema-level auth enforces Admin-only for delete operations

### 6.5 Data Filtering

- ✅ **listProducts:** Default filter excludes `deletedAt IS NOT NULL` unless `includeDeleted: true` AND `isAdmin`
- ✅ **Storefront:** `listProducts` never includes deleted (no `includeDeleted` option in public API)

---

## 7. DECISIONS & NOTES

### 7.1 AI Enrich Access

**Decision:** **Admin only** (recommended)
- **Rationale:** AI enrichment may cost money (OpenAI API), should be admin-controlled
- **Implementation:** Hide "AI Enrich" button in `AdminProductForm` if `!isAdmin`

### 7.2 Edit Modal vs Route

**Decision:** **Route-based editing** (`/admin/products/:id/edit`)
- **Rationale:** 
  - Better for deep linking, browser back/forward
  - Easier to share edit links
  - Consistent with create (`/admin/products/new`)
- **Implementation:** Keep `AdminProductForm` as route, not modal

### 7.3 Inline Edit vs Full Edit

**Decision:** **Both**
- **Inline:** Price, stock, active toggle, category (quick changes)
- **Full Edit:** All fields (images, description, attributes, tags, etc.) via route

### 7.4 CSV Import Access

**Decision:** **Admin only**
- **Rationale:** Bulk import is admin operation
- **Implementation:** Hide "Import CSV" button if `!isAdmin`

### 7.5 Deleted View Access

**Decision:** **Admin only**
- **Rationale:** Deleted items are admin concern
- **Implementation:** Hide "Deleted" tab if `!isAdmin`

---

## 8. IMPLEMENTATION ORDER (Recommended)

1. **Backend first:** Schema changes + API functions (soft delete, restore, hard delete)
2. **Shared hooks:** `useProducts`, `useCategories`, `useBulkActions`, `useInlineEdit`
3. **New components:** FilterTabs, BulkActionsBar, InlineEditCell, ProductRowActions
4. **UnifiedAdminProducts:** Build main component integrating all pieces
5. **RBAC:** Add `isAdmin` checks and UI gating
6. **Cleanup:** Remove ManagerProduct route, update navigation
7. **Testing:** Verify all scenarios

---

## 9. BACKWARD COMPATIBILITY

- **Existing `deleteProduct` calls:** Update to `softDeleteProduct` or add `hard` parameter
- **ManagerProduct route:** Redirect to `/admin/products` (or remove after migration)
- **AdminProducts:** Replace with UnifiedAdminProducts (same route, enhanced features)

---

## 10. OBSERVABILITY

- **ErrorBoundary:** Wrap `UnifiedAdminProducts` (reuse from ManagerProduct)
- **Toasts:** Use toast library (react-hot-toast or similar) for:
  - Success: "Product deleted", "Product restored", "Bulk action completed"
  - Error: "Failed to delete", "Failed to restore"
- **Loading states:** Show spinners during bulk operations, inline edit saves
- **Activity log (optional):** Log delete/restore/perma-delete with userId, timestamp, productId to separate table or CloudWatch
