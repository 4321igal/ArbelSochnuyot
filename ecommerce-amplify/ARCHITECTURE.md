# AWS Amplify Gen2 E-Commerce Architecture

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
│ - Static Assets │  │ - Mutations     │  │ - Groups:       │  │ - File Upload   │
│ - CDN Edge      │  │ - Subscriptions │  │   Admin/Customer│  │ - presignedURLs │
└─────────────────┘  └────────┬────────┘  └─────────────────┘  └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    DynamoDB     │
                    │                 │
                    │ - Categories    │
                    │ - Products      │
                    │ - ProductSearch │
                    │ - Carts         │
                    │ - Orders        │
                    │ - UserProfiles  │
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
│ Payment Gateway │  │   OpenAI API    │  │    DynamoDB     │
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

## 2. SCREEN MAP (Routes)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    PUBLIC ROUTES                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  /                          Home Page                                                   │
│  ├── Featured Products carousel                                                         │
│  ├── Categories grid                                                                    │
│  └── Deals section                                                                      │
│                                                                                         │
│  /category/:slug            Category Listing                                            │
│  ├── Product grid with pagination                                                       │
│  ├── Filters (brand, price range)                                                       │
│  └── Sort options                                                                       │
│                                                                                         │
│  /product/:id               Product Details                                             │
│  ├── Image gallery                                                                      │
│  ├── Price, description, attributes                                                     │
│  ├── Add to cart button                                                                 │
│  └── Related products                                                                   │
│                                                                                         │
│  /search?q=                 Search Results                                              │
│  ├── Products matching query                                                            │
│  └── Category facets                                                                    │
│                                                                                         │
│  /cart                      Shopping Cart                                               │
│  ├── Cart items list                                                                    │
│  ├── Quantity adjustment                                                                │
│  ├── Price totals                                                                       │
│  └── Proceed to checkout                                                                │
│                                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                 AUTHENTICATED ROUTES                                     │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  /checkout                  Checkout Flow (Customer)                                    │
│  ├── Shipping address                                                                   │
│  ├── Payment method                                                                     │
│  └── Order confirmation                                                                 │
│                                                                                         │
│  /orders                    Order History (Customer)                                    │
│  ├── List of past orders                                                                │
│  └── Order detail view                                                                  │
│                                                                                         │
│  /account                   Account Settings (Customer)                                 │
│  ├── Profile info                                                                       │
│  ├── Addresses                                                                          │
│  └── Password change                                                                    │
│                                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                   ADMIN ROUTES                                           │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  /admin                     Admin Dashboard                                             │
│  ├── Sales overview                                                                     │
│  ├── Recent orders                                                                      │
│  └── Quick actions                                                                      │
│                                                                                         │
│  /admin/products            Product Management                                          │
│  ├── Product list (paginated)                                                           │
│  ├── Create new product                                                                 │
│  ├── Edit product                                                                       │
│  ├── Image upload                                                                       │
│  ├── Publish/Unpublish                                                                  │
│  └── AI enrichment trigger                                                              │
│                                                                                         │
│  /admin/products/new        Create Product                                              │
│  /admin/products/:id/edit   Edit Product                                                │
│                                                                                         │
│  /admin/categories          Category Management                                         │
│  ├── Category tree                                                                      │
│  └── CRUD operations                                                                    │
│                                                                                         │
│  /admin/orders              Order Management                                            │
│  ├── All orders list                                                                    │
│  ├── Filter by status                                                                   │
│  └── Update order status                                                                │
│                                                                                         │
│  /admin/orders/:id          Order Details                                               │
│  ├── Order items                                                                        │
│  ├── Customer info                                                                      │
│  └── Status history                                                                     │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## 3. TECH STACK JUSTIFICATION

### Frontend: Vite + React (over Next.js)
- **Faster DX**: Vite's HMR is near-instant, critical for MVP speed
- **Simpler Amplify Integration**: No SSR complexity; Amplify Gen2 works best with SPAs
- **Smaller Bundle**: No Next.js overhead for features we don't need
- **Easier Deployment**: Static hosting on Amplify is simpler than SSR

### State Management: React Context (over Redux)
- **Sufficient for MVP**: Cart + Auth state doesn't require Redux complexity
- **Less Boilerplate**: Faster to implement for day-one delivery
- **Easy Migration**: Can add Zustand/Redux later if needed

### Why Amplify Gen2
- **Type-Safe**: Full TypeScript support with generated types
- **Unified Backend**: Auth, Data, Storage, Functions in one project
- **Local Development**: Sandbox for rapid iteration
- **Cost-Effective**: Pay-per-use with no upfront costs
