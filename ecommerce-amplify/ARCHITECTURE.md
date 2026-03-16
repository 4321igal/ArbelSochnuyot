# AWS Amplify Gen2 E-Commerce Architecture

תיעוד הארכיטקטורה והקוד הקיים בפרויקט.

---

## 1. ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    BROWSER (React SPA)                                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
           │                    │                    │                    │
           ▼                    ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Amplify Hosting │  │   AppSync API   │  │  Cognito Auth   │  │  S3 Storage     │
│ (S3+CloudFront) │  │   (GraphQL)     │  │  (User Pools)   │  │ (Signed URLs)   │
│                 │  │                 │  │                 │  │                 │
│ - React Bundle  │  │ - Queries       │  │ - Sign Up/In    │  │ - Product Imgs  │
│ - Static Assets │  │ - Mutations     │  │ - Groups:       │  │ - CSV imports   │
│ - CDN Edge      │  │ - Subscriptions │  │   Admin/Customer│  │ - Category Imgs │
└─────────────────┘  └────────┬────────┘  └─────────────────┘  └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    DynamoDB     │
                    │                 │
                    │ - Category     │
                    │ - Product      │
                    │ - ProductSearchMeta │
                    │ - Cart         │
                    │ - CartItem     │
                    │ - Order        │
                    │ - OrderItem    │
                    │ - UserProfile  │
                    └─────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Lambda:         │  │ Lambda:         │  │ Lambda:         │
│ paymentsWebhook │  │ aiEnrichProduct │  │ placeOrder      │
│                 │  │                 │  │                 │
│ POST /webhook   │  │ AppSync Trigger │  │ AppSync Trigger │
│ - Verify sig    │  │ - Read Product  │  │ - Cart → Order  │
│ - Update Order  │  │ - Call OpenAI   │  │ - Atomic txn    │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Payment Gateway │  │   OpenAI API    │  │    DynamoDB      │
│ (Stripe/etc)    │  │                 │  │ (TransactWrite) │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
                    ┌─────────────────┐
                    │ CloudWatch Logs │
                    │                 │
                    │ - Lambda logs   │
                    │ - AppSync logs  │
                    │ - API metrics   │
                    └─────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              SECRETS & CONFIGURATION                                     │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  AWS Secrets Manager / SSM Parameter Store                                              │
│  ├── /amplify/ecommerce/OPENAI_API_KEY                                                  │
│  ├── /amplify/ecommerce/PAYMENT_WEBHOOK_SECRET                                          │
│  └── /amplify/ecommerce/PAYMENT_API_KEY                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. SCREEN MAP (Routes)

מבוסס על `App.tsx` ו־`AdminRoute.tsx`.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    PUBLIC ROUTES                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  /                          HomePage                                                   │
│  ├── Hero, Featured Products (listFeaturedProducts)                                    │
│  ├── Categories grid (listCategories, top-level only)                                  │
│  └── Links: /category/all, /category/:slug, /category/featured                          │
│                                                                                         │
│  /category/:slug            CategoryPage                                               │
│  ├── Virtual slugs: "all" (כל המוצרים), "featured" (מוצרים מומלצים)                    │
│  ├── Otherwise: getCategoryBySlug → listProductsByCategory                             │
│  ├── Product grid, filters (brand), sort, Load More                                    │
│  └── Category Not Found / Category Unavailable + Back to Home                          │
│                                                                                         │
│  /product/:id               ProductPage                                                │
│  ├── getProduct(id), תצוגת תמונות, מחיר, Add to cart                                    │
│  └── Product not found handling                                                        │
│                                                                                         │
│  /search                    SearchPage                                                 │
│  └── חיפוש מוצרים (query param)                                                         │
│                                                                                         │
│  /cart                      CartPage                                                  │
│  ├── CartContext, רשימת פריטים, כמות, סיכום                                             │
│  └── Proceed to checkout                                                               │
│                                                                                         │
│  /auth                      AuthPage                                                  │
│  └── Sign In / Sign Up (Amplify UI)                                                    │
│                                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                         PROTECTED ROUTES (משתמש מחובר – ProtectedRoute)                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  /checkout                  CheckoutPage                                               │
│  ├── כתובת משלוח, payment, placeOrderMutation                                          │
│  └── Order confirmation                                                                 │
│                                                                                         │
│  /orders                    OrdersPage                                                 │
│  └── listOrders (הזמנות של המשתמש)                                                     │
│                                                                                         │
│  /account                   AccountPage                                               │
│  └── הגדרות חשבון                                                                       │
│                                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                         ADMIN ROUTES (AdminRoute)                                        │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  גישה: לא מחובר → /auth. מחובר אבל לא Admin → רק הנתיבים המפורטים למטה.                │
│  דפים שפתוחים לכל משתמש מחובר (ללא צורך ב־Admin):                                       │
│    /admin/manager-product, /admin/import-csv, /admin/categories, /admin/products/*     │
│  דפים שדורשים Admin: /admin, /admin/orders, /admin/orders/:id                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  /admin                     AdminDashboard (Admin only)                                 │
│  ├── סטטיסטיקות, הזמנות אחרונות, קישורים למוצרים/קטגוריות/הזמנות                        │
│  └── Quick actions: Add Product, Categories, Orders                                    │
│                                                                                         │
│  /admin/products            AdminProducts                                              │
│  ├── listProducts (filter: all / active / inactive), pagination, Load More             │
│  ├── Bulk delete (selected), Toggle active, Edit, Delete                               │
│  └── Link to /admin/products/new                                                        │
│                                                                                         │
│  /admin/products/new        AdminProductForm (create)                                  │
│  /admin/products/:id/edit   AdminProductForm (edit)                                    │
│  ├── listAllCategories, getProduct, createProduct, updateProduct                       │
│  ├── uploadProductImages, AI Enrich (enrichProductMutation)                            │
│  └── Category required, validation, navigate to /admin/products after save           │
│                                                                                         │
│  /admin/manager-product     ManagerProduct (כל משתמש מחובר)                             │
│  ├── ProductGrid / ProductTable, SearchBar, StatsSection                                │
│  ├── AddProductModal, EditProductModal, AddCategoryModal, ImportCSVModal                │
│  ├── useCSVImport, createProduct, updateProduct, deleteProduct, listCategories         │
│  └── ErrorBoundary                                                                      │
│                                                                                         │
│  /admin/categories          AdminCategories (כל משתמש מחובר)                             │
│  ├── listAllCategories(includeInactive), search/filter, product count                  │
│  ├── CategoryFormModal: createCategory, updateCategory, deleteCategory                 │
│  └── היררכיה, image URL + upload (uploadCategoryImage)                                  │
│                                                                                         │
│  /admin/import-csv         AdminImportCSV (כל משתמש מחובר)                              │
│  ├── uploadCSVImport (S3), parse CSV, column mapping (title/price/category/sku)        │
│  ├── listCategories, default category, addAsActive                                     │
│  └── Add row / Add all as products (createProduct)                                     │
│                                                                                         │
│  /admin/orders              AdminOrders (Admin only)                                    │
│  ├── listOrders (admin), filter by status, update status                              │
│  └── Link to /admin/orders/:id                                                          │
│                                                                                         │
│  /admin/orders/:id          AdminOrderDetail (Admin only)                               │
│  ├── getOrder, OrderItem list, customer, status update                                 │
│  └── Back to orders                                                                     │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. FRONTEND STRUCTURE (src/)

```
src/
├── App.tsx                    # Routes, MainLayout / AdminLayout, ProtectedRoute, AdminRoute
├── main.tsx                   # React root, configureAmplify(), AuthProvider, CartProvider
│
├── components/
│   ├── layout/
│   │   ├── MainLayout.tsx     # Header (logo, search, cart, user), nav, footer, Outlet
│   │   └── AdminLayout.tsx    # Sidebar (Dashboard, Products, Manager Product, Categories, Orders, Import CSV), Outlet
│   ├── auth/
│   │   ├── ProtectedRoute.tsx # מפנה ל-/auth אם לא מחובר
│   │   └── AdminRoute.tsx     # מפנה ל-/auth אם לא מחובר; ל-/ אם מחובר ולא Admin (חוץ מנתיבים מותרים)
│   ├── product/
│   │   ├── ProductGrid.tsx    # תצוגת רשת מוצרים
│   │   └── ProductCard.tsx    # כרטיס מוצר (תמונה, מחיר, לינק)
│   ├── admin/
│   │   └── CategoryFormModal.tsx  # יצירה/עריכת קטגוריה, היררכיה, תמונה
│   └── managerProduct/
│       ├── ManagerProduct.tsx    # דף ניהול מוצרים (גריד/טבלה, מודלים)
│       ├── ProductHeader.tsx, ProductGrid.tsx, ProductTable.tsx, SearchBar.tsx, StatsSection.tsx
│       ├── AddProductModal.tsx, EditProductModal.tsx, AddCategoryModal.tsx, ImportCSVModal.tsx
│       ├── ErrorBoundary.tsx, useCSVImport.ts
│       ├── types.ts, constants.ts
│       └── ...
│
├── pages/
│   ├── HomePage.tsx
│   ├── CategoryPage.tsx
│   ├── ProductPage.tsx
│   ├── SearchPage.tsx
│   ├── CartPage.tsx
│   ├── AuthPage.tsx
│   ├── CheckoutPage.tsx
│   ├── OrdersPage.tsx
│   ├── AccountPage.tsx
│   └── admin/
│       ├── AdminDashboard.tsx
│       ├── AdminProducts.tsx
│       ├── AdminProductForm.tsx
│       ├── AdminCategories.tsx
│       ├── AdminOrders.tsx
│       ├── AdminOrderDetail.tsx
│       └── AdminImportCSV.tsx
│
└── lib/
    ├── amplify/
    │   ├── client.ts          # generateClient() – Amplify Data
    │   └── configure.ts       # Amplify.configure(amplify_outputs.json)
    ├── api/
    │   ├── products.ts        # Product/Category CRUD, listProducts, listCategories, getCategoryBySlug, createProduct, ...
    │   ├── orders.ts          # listOrders, getOrder, updateOrderStatus, placeOrderMutation
    │   ├── storage.ts         # getImageUrl, uploadProductImages, uploadCategoryImage, uploadCSVImport
    │   └── schema.ts          # getAdminSchema(), ADMIN_SCHEMA_STATIC (ל־CSV import mapping)
    ├── auth/
    │   └── AuthContext.tsx    # useAuth: isAuthenticated, isAdmin, userAttributes, signOut
    └── cart/
        └── CartContext.tsx    # Cart state, add/remove/update quantity, load from API
```

---

## 4. DATA LAYER & BACKEND

### Amplify Data (AppSync + DynamoDB)

- **סכמה:** `amplify/data/resource.ts`  
  Category, Product, ProductSearchMeta, Cart, CartItem, Order, OrderItem, UserProfile.  
  מוטציות מותאמות: `placeOrderMutation`, `enrichProductMutation`, `processPaymentWebhook`.
- **לקוח:** `src/lib/amplify/client.ts` – `generateClient()`; כל הקריאות עוברות דרך ה־client (לא REST נפרד).

### Lambda

- **placeOrder:** `amplify/functions/place-order/` – המרת עגלה להזמנה, TransactWrite (Order, OrderItem, Cart, CartItem).
- **aiEnrichProduct:** `amplify/functions/ai-enrich-product/` – קריאת מוצר, OpenAI, שמירת ProductSearchMeta.
- **paymentsWebhook:** `amplify/functions/payments-webhook/` – קבלת webhook תשלום, עדכון Order.

### S3 (Storage)

- תמונות מוצרים, תמונות קטגוריות, קבצי CSV ליבוא (`uploadProductImages`, `uploadCategoryImage`, `uploadCSVImport`).

---

## 5. SCRIPTS & DOCS

| Command | תיאור |
|--------|--------|
| `npm run dev` | Vite dev server |
| `npm run build` | tsc + vite build |
| `npm run sandbox` | npx ampx sandbox (backend מקומי) |
| `npm run db:reset-products` | איפוס נתוני מוצרים (LOCAL only, עם אישור) |
| `npm run db:reset-products:dry-run` | סימולציה בלבד (ללא מחיקה) |

- **תיעוד:** `docs/CODE_REVIEW_ADD_PRODUCT_FLOW.md`, `docs/RESET_PRODUCTS.md` (איפוס מוצרים, ERD, flow).

---

## 6. TECH STACK JUSTIFICATION

### Frontend: Vite + React (over Next.js)
- **Faster DX**: Vite's HMR is near-instant
- **Simpler Amplify Integration**: No SSR; Amplify Gen2 works best with SPAs
- **Smaller Bundle**: No Next.js overhead
- **Easier Deployment**: Static hosting on Amplify

### State Management: React Context
- **AuthContext**: isAuthenticated, isAdmin, userAttributes, signOut
- **CartContext**: cart items, add/remove/update, sync with backend when needed
- Sufficient for current scope; can add Zustand/Redux later

### Why Amplify Gen2
- **Type-Safe**: TypeScript, generated types from schema
- **Unified Backend**: Auth, Data, Storage, Functions in one project
- **Local Development**: Sandbox for rapid iteration
- **Cost-Effective**: Pay-per-use
