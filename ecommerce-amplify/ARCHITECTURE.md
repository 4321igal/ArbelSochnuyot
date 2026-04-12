# Architecture

Documentation of **ecommerce-amplify**: a single-page React storefront and admin UI on **AWS Amplify Gen 2** (Cognito, AppSync, DynamoDB, S3, Lambda). Source of truth is the repository; this file does not depend on prior doc revisions.

---

## 1. Overview

| Concern | Implementation |
|---------|----------------|
| UI | React 18, TypeScript, Vite 5, Tailwind CSS, React Router 6 |
| API surface to browser | AWS AppSync GraphQL (Amplify Data) + Amplify Storage SDK; **no separate Express server** in this app |
| Auth | Amazon Cognito User Pool; groups `Admin`, `Customer` |
| Persistence | DynamoDB tables behind Amplify Data models; S3 bucket via Amplify Storage |
| Heavy workflows | Three Node Lambdas: **place-order**, **ai-enrich-product**, **payments-webhook** |
| Config | `amplify_outputs.json` loaded in `configureAmplify()` before React render (`src/main.tsx`) |

**Reasonable assumption:** Amplify Hosting serves static `dist/` assets; optional CloudFront in front is common but not defined in repo files.

---

## 2. System Architecture

High-level topology:

- **Browser** runs the SPA (`npm run build` → `dist/`).
- **Amplify.configure(outputs)** wires Auth, GraphQL endpoint, Storage bucket from generated outputs.
- **AppSync** resolves model CRUD and three **custom mutations** that invoke Lambdas.
- **DynamoDB** stores entity state; Lambdas also use **@aws-sdk/lib-dynamodb** with env-injected table names for transactional order logic and webhook updates.
- **S3** holds images under `images/*` (and Amplify `public/` conventions for guest-level access).
- **Secrets Manager / SSM** (scoped by IAM in `amplify/backend.ts`) supply OpenAI and payment webhook secrets to two Lambdas.

See **`ARCHITECTURE_DIAGRAMS.md`** for Mermaid diagrams (system, data flow, sequences, AI, deployment).

---

## 3. Components Breakdown

### 3.1 Frontend (`src/`)

| Area | Location | Role |
|------|----------|------|
| Bootstrap | `main.tsx` | `configureAmplify()`, `AuthProvider`, `CartProvider`, `BrowserRouter` |
| Routes | `App.tsx`, `routes/lazy.tsx` | Lazy-loaded pages + `LazySuspense`; public `MainLayout` vs `AdminLayout` |
| Auth UI | `pages/AuthPage.tsx` | `@aws-amplify/ui-react` `Authenticator`; CSS import local to auth chunk |
| Auth state | `lib/auth/AuthContext.tsx` | `getCurrentUser`, `fetchUserAttributes`, `fetchAuthSession`, `cognito:groups` → `isAdmin` |
| Data client | `lib/amplify/client.ts` | `generateClient<any>()` |
| Domain APIs | `lib/api/products.ts`, `orders.ts`, `siteHero.ts`, `storage.ts`, `categoriesDelete.ts`, `categoriesImport.ts`, `schema.ts` | Wrappers over `client.models.*`, `client.mutations.*`, Storage |
| Cart | `lib/cart/CartContext.tsx` | Guests: **localStorage**; signed-in: `Cart` / `CartItem` via AppSync |
| Guards | `components/auth/ProtectedRoute.tsx`, `AdminRoute.tsx` | Auth required for checkout/orders/account; admin shell with **partial** non-admin access (see §9) |
| Media | `StorageImage.tsx`, `hooks/useStorageImageUrl.ts`, `lib/api/storage.ts` | DB stores **S3 keys**; **signed GET URLs** at runtime (in-memory cache) |
| Hero CMS | `components/hero/PublicHeroSection.tsx`, `pages/admin/AdminHeroPage.tsx`, `lib/api/siteHero.ts` | Singleton `SiteHero` id `hero-main` |

### 3.2 Backend definition (`amplify/`)

| Resource | File(s) |
|----------|---------|
| Auth | `auth/resource.ts` — email login, MFA optional, groups, password policy |
| Data schema + custom ops | `data/resource.ts` — models + `placeOrderMutation`, `enrichProductMutation`, `processPaymentWebhook` |
| Storage | `storage/resource.ts` — path-based ACL for `images/**`, `public/*` |
| Lambdas | `functions/place-order`, `ai-enrich-product`, `payments-webhook` — `resource.ts` + `handler.ts` |
| Shared runtime | `functions/shared/logger.ts`, `secrets.ts`, `dynamodb.ts` |
| Composition | `backend.ts` — `defineBackend`, IAM for secrets, S3 CORS, custom output `apiEndpoint` |

**Dead / unused in backend composition:** `amplify/functions/get-admin-schema/` defines a function but is **not** registered in `defineBackend`. CSV import uses **static** schema in `src/lib/api/schema.ts` (`getAdminSchema()` returns in-repo JSON).

---

## 4. Data Flow

### Catalog & marketing (read)

1. Client calls `client.models.*.list` / `get` (e.g. `Product`, `Category`, `SiteHero`) subject to schema `authorization` rules.
2. Images: fields hold **object keys**; UI resolves URLs via `getUrl` (Amplify Storage), cached in `storage.ts` / hooks.

### Cart

- **Unauthenticated:** cart JSON in browser **`localStorage`** (see `CartContext` — key constant in file).
- **Authenticated:** query `Cart` by `userId` + `ACTIVE`; load `CartItem` rows. Owner auth uses `identityClaim('sub')`.

### Checkout → order (write, transactional)

1. `CheckoutPage` → `placeOrder()` in `lib/api/orders.ts`.
2. Client invokes **`placeOrderMutation`** with cart id, addresses, shipping/payment method, **`idempotencyKey`** (UUID from `uuid` package import in `orders.ts`).
3. **`place-order` Lambda** validates caller, loads cart/items/products, computes totals (shipping table + VAT constant in handler), writes **Order** + **OrderItems** via **TransactWrite**, clears cart (per handler + `shared/dynamodb.ts`).
4. Returns **Order** to client.

### AI metadata

1. Admin triggers **`enrichProductMutation`** (Cognito **Admin** group only).
2. **`ai-enrich-product` Lambda** reads product from DynamoDB, fetches **`amplify/ecommerce/OPENAI_API_KEY`** from Secrets Manager (`shared/secrets.ts` with TTL cache), calls OpenAI, upserts **ProductSearchMeta**.

### Payment webhook

1. Provider invokes **`processPaymentWebhook`** (`allow.guest()` so unauthenticated GraphQL caller can reach handler — **signature** checked in Lambda).
2. **`payments-webhook` Lambda** uses **`amplify/ecommerce/PAYMENT_WEBHOOK_SECRET`**, parses Stripe-shaped JSON in code, updates order in DynamoDB.

**Background jobs:** No SQS/EventBridge in `backend.ts`; async work is **synchronous Lambda** execution on mutation invocation.

---

## 5. Frontend Architecture

- **Bundler:** Vite; alias `@` → `src`. **No `manualChunks`** splitting React from Amplify (avoids circular chunk / TDZ production errors documented in `vite.config.ts`). Code splitting is primarily **route-level** (`React.lazy` in `routes/lazy.tsx`).
- **Styling:** Tailwind (`tailwind.config.js`, `src/styles/index.css`).
- **Global state:** React Context (auth, cart); no Redux in `package.json`.
- **Search page:** Fetches a bounded product list and filters **client-side** (explicitly noted as basic in source comments).
- **Admin products:** `UnifiedAdminProducts.tsx` — debounced search, `nextToken` pagination, bulk operations; `listProducts` in `products.ts` applies some filters post-fetch.

---

## 6. Backend Architecture

- **Amplify Gen 2** `defineBackend({ auth, data, storage, paymentsWebhook, aiEnrichProduct, placeOrder })`.
- **Custom mutations** bridge AppSync → Lambda; resolver identity passed into handlers (`event.identity?.sub` in place-order).
- **IAM:** Extra policy on **aiEnrichProduct** and **paymentsWebhook** Lambdas for `secretsmanager:GetSecretValue` and `ssm:GetParameter(s)` on `amplify/ecommerce/*` ARNs.
- **S3 CORS:** Bucket CORS allows `localhost:5173` and `https://*.amplifyapp.com`; comment prompts adding production origin.

---

## 7. Database & Storage Design

### 7.1 Amplify Data models (DynamoDB)

Defined in `amplify/data/resource.ts`:

| Model | Notes |
|-------|--------|
| **Category** | Tree `parentId`; GSI `slug`, `parentId`+`sortOrder`; soft delete fields |
| **Product** | GSI `categoryId`+`createdAt`, `brand`+`createdAt`; soft delete |
| **ProductSearchMeta** | AI fields; GSI `productId` |
| **Cart** | GSI `userId`+`createdAt`; status enum |
| **CartItem** | GSI `cartId`, `productId`; price/title/image snapshots |
| **Order** | GSI `userId`+`createdAt`, `status`+`createdAt`, `orderNumber`, `idempotencyKey`; JSON addresses |
| **OrderItem** | Snapshots; GSI `orderId`, `productId` |
| **UserProfile** | JSON `addresses` / `preferences`; GSI `userId`, `email` |
| **SiteHero** | Marketing copy + `imageKey`; public read, Admin write |

**GraphQL authorization modes:** `defaultAuthorizationMode: 'userPool'`; `apiKeyAuthorizationMode` **expiresInDays: 365** (available for clients that use API key — not all frontend paths do).

### 7.2 S3 (Amplify Storage)

`amplify/storage/resource.ts`: prefixes under **`images/`** plus **`public/*`**. Rules grant guest read on catalog/hero paths, authenticated write, Admin delete where specified; avatars scoped by `entity_id`; `imports/*` for CSV; `temp/{entity_id}/*` for per-user temp.

Client uploads use **`uploadData`** with **`accessLevel: 'guest'`** for shared catalog paths (matches Amplify v6 public prefix behavior).

---

## 8. External Integrations

| Service | Consumption |
|---------|-------------|
| **OpenAI** | `ai-enrich-product/handler.ts`; API key secret name **`amplify/ecommerce/OPENAI_API_KEY`** |
| **Payment provider** | Webhook payload + HMAC-style validation in `payments-webhook/handler.ts`; secret **`amplify/ecommerce/PAYMENT_WEBHOOK_SECRET`** |
| **Cognito email** | Verification template in `auth/resource.ts` |

---

## 9. Authentication & Security

- **Sign-in:** Email + password; optional TOTP MFA (`OPTIONAL` mode).
- **Groups:** `Admin`, `Customer` — `AuthContext` sets `isAdmin` from JWT `cognito:groups`.
- **AdminRoute:** After authentication, **`/admin/import-csv`**, **`/admin/categories`**, and **`/admin/products`** (prefix) are reachable by **any** signed-in user; remaining `/admin/*` require **`isAdmin`**. Backend schema still enforces Cognito rules on mutations — **UI route is looser than “Admin only”** for those paths.
- **placeOrderMutation:** `allow.authenticated()` only (not guest).
- **processPaymentWebhook:** `allow.guest()` — security depends on **signature verification** in Lambda.
- **Logging:** `shared/logger.ts` scrubs keys matching PII name patterns before JSON log emission.

---

## 10. Deployment & Environments

| Path | Mechanism |
|------|-----------|
| CI/CD | Repo **`amplify.yml`**: `appRoot: ecommerce-amplify` |
| Frontend | `npm install`, `npm run build`, artifact **`dist/**`** |
| Backend | `npm install`, **`npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID`** |
| Local | `npm run dev` (Vite **5173**); backend via `npx ampx sandbox` (scripts in `package.json`) |

**Environment pairing:** `amplify_outputs.json` at project root (or path used by `configure.ts`) must match the deployed backend for that environment.

---

## 11. Observability (Logging, Monitoring, Errors)

- **Lambdas:** Structured JSON logs via `Logger` class → stdout → **CloudWatch Logs**; level from env **`LOG_LEVEL`** (default INFO).
- **Frontend:** Errors mostly `console.error` and user-visible strings; no APM or error-reporting SDK in dependencies.
- **Secrets helper:** In-memory cache (~5 min) per Lambda container to reduce Secrets Manager calls.

**Reasonable assumption:** Alarms/dashboards would be configured in AWS Console; not codified here.

---

## 12. Scalability & Performance

- **Pagination:** `nextToken` used in multiple list UIs (e.g. category products, admin orders, unified products).
- **Client-side filtering:** Portions of `listProducts` and `SearchPage` filter in the browser — **O(n)** over fetched pages, not suitable for very large catalogs without API changes.
- **`getProductCountByCategoryMap`:** Paginates through products — costly at scale.
- **Images:** Short-lived URL cache; lazy loading on several image components.
- **Vite:** `dedupe: ['rxjs','tslib']`, `optimizeDeps.include` for Amplify stack; stable production bundle without manual React/Amplify split.

---

## 13. Risks & Limitations

1. **Dual data access:** AppSync for normal CRUD vs Lambda + raw DynamoDB for orders/webhook/AI — schema/table drift risk if models change without updating `shared/dynamodb.ts` and env wiring.
2. **Webhook mutation is public** at GraphQL auth layer — compromised secret or weak validation is high impact.
3. **Guest cart** — not durable cross-device; merge on login not evident in reviewed cart code.
4. **Staff vs Admin routes** — authenticated non-admins can open some admin URLs; relies on API authorization for writes.
5. **Static CSV schema** — `get-admin-schema` Lambda not deployed; drift requires manual `schema.ts` updates.
6. **CORS** — custom production domain must be added to S3 CORS in `backend.ts` if not under `*.amplifyapp.com`.
7. **`placeOrder` Lambda** — synchronous; long-running checkout could hit Lambda timeout under extreme load (limit not stated in repo).

---

## 14. Gaps & Suggested Improvements

1. Register **`get-admin-schema`** in `backend.ts` and call it from `getAdminSchema()`, or delete unused Lambda folder.
2. Reconcile **AdminRoute** with product intent: require Admin for all `/admin/*` or document staff role explicitly.
3. Server-side **search** and **filtered list** APIs for large catalogs.
4. **Category product counts** without full-table scans (denormalized count, aggregate, or cache).
5. **Frontend error boundary** + optional **RUM** or third-party error tracking.
6. **Integration tests** for `placeOrderMutation` idempotency and webhook signature failure paths.
7. **Branch-specific** `amplify_outputs` in CI (secrets / artifacts) if not already handled outside repo.
8. Add **`uuid`** to `package.json` `dependencies` if it is only hoisted transitively (clarity and reproducibility).

---

*Derived from `ecommerce-amplify/` source and `amplify.yml` only.*
