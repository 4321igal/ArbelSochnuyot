# Architecture Diagrams

Mermaid diagrams for **ecommerce-amplify**. They reflect the implementation in `amplify/` and `src/`; dashed lines indicate **reasonable assumptions** (e.g. CDN) where not defined in repo files.

---

## 1. System architecture

```mermaid
flowchart TB
  subgraph Client["Browser (SPA)"]
    REACT["React 18 + Vite"]
    AMPLIFY_JS["aws-amplify Auth / Data / Storage"]
    REACT --> AMPLIFY_JS
  end

  subgraph AWS["AWS (Amplify Gen 2)"]
    COGNITO["Cognito User Pool"]
    APPSYNC["AppSync GraphQL"]
    DDB["DynamoDB"]
    S3["S3 Bucket (Storage)"]
    L1["Lambda: place-order"]
    L2["Lambda: ai-enrich-product"]
    L3["Lambda: payments-webhook"]
    SM["Secrets Manager / SSM\n(amplify/ecommerce/*)"]
  end

  AMPLIFY_JS --> COGNITO
  AMPLIFY_JS --> APPSYNC
  AMPLIFY_JS --> S3
  APPSYNC --> DDB
  APPSYNC --> L1
  APPSYNC --> L2
  APPSYNC --> L3
  L1 --> DDB
  L2 --> DDB
  L2 --> SM
  L3 --> DDB
  L3 --> SM

  subgraph Assumption["Reasonable assumption"]
    CDN["CloudFront / Amplify Hosting CDN"]
  end
  CDN -.-> REACT
```

---

## 2. Data flow (catalog, cart, checkout)

```mermaid
flowchart LR
  subgraph ReadPath["Catalog read path"]
    P1["Pages: Home / Category / Product"]
    GQL_R["AppSync: list / get\nProduct, Category, SiteHero, …"]
    DDB_R[(DynamoDB)]
    P1 --> GQL_R --> DDB_R
  end

  subgraph CartPath["Cart path"]
    G["Guest"]
    LS[("localStorage")]
    U["Authenticated user"]
    GQL_C["AppSync: Cart, CartItem"]
    DDB_C[(DynamoDB)]
    G --> LS
    U --> GQL_C --> DDB_C
  end

  subgraph ImgPath["Image path"]
    UI["StorageImage / getUrl"]
    S3[(S3 keys → signed GET)]
    UI --> S3
  end

  subgraph OrderPath["Order path"]
    CH["CheckoutPage"]
    MUT["placeOrderMutation"]
    L["place-order Lambda"]
    TX["TransactWrite\nOrder + OrderItems"]
    DDB_O[(DynamoDB)]
    CH --> MUT --> L --> TX --> DDB_O
  end
```

---

## 3. Request lifecycle — authenticated checkout (sequence)

```mermaid
sequenceDiagram
  participant U as User browser
  participant AC as AuthContext / Cognito
  participant AP as AppSync
  participant LO as place-order Lambda
  participant DB as DynamoDB

  U->>AC: JWT on API calls
  U->>AP: Cart / CartItem queries (owner)
  AP->>DB: Query / read
  DB-->>AP: Cart + items
  AP-->>U: Cart state

  U->>AP: placeOrderMutation(args + idempotencyKey)
  AP->>LO: Invoke resolver
  LO->>LO: Validate identity.sub
  LO->>DB: Read cart, items, products
  LO->>DB: TransactWrite Order + OrderItems, clear cart
  DB-->>LO: OK
  LO-->>AP: Order payload
  AP-->>U: GraphQL response
```

---

## 4. AI processing flow

```mermaid
flowchart TD
  A["Admin UI triggers\nenrichProductMutation"] --> B["AppSync"]
  B --> C["ai-enrich-product Lambda"]
  C --> D["getProduct (DynamoDB)"]
  D --> E{"Product exists?"}
  E -->|no| F["Throw / error response"]
  E -->|yes| G["getSecret\nOPENAI_API_KEY"]
  G --> H["OpenAI HTTP API\n(structured prompt in handler)"]
  H --> I["Parse JSON enrichment"]
  I --> J["upsert ProductSearchMeta\n(DynamoDB)"]
  J --> K["Return ProductSearchMeta\nto GraphQL client"]
```

---

## 5. Deployment architecture

```mermaid
flowchart TB
  subgraph Repo["Git repository"]
    YML["amplify.yml\nappRoot: ecommerce-amplify"]
    SRC["src/ + amplify/"]
  end

  subgraph Amp["AWS Amplify Hosting / Gen2 pipeline"]
    FB["Frontend build\nnpm install && npm run build"]
    BB["Backend build\nampx pipeline-deploy\n$AWS_BRANCH / $AWS_APP_ID"]
    ART["Artifact: dist/**"]
  end

  subgraph Runtime["Runtime targets"]
    STATIC["Static hosting\nSPA assets"]
    BACK["CloudFormation / CDK\nAuth + Data + Storage + Lambdas"]
  end

  YML --> FB
  YML --> BB
  SRC --> FB
  SRC --> BB
  FB --> ART
  ART --> STATIC
  BB --> BACK

  subgraph Local["Local developer"]
    DEV["vite dev :5173"]
    SANDBOX["npx ampx sandbox"]
  end
  SRC --> DEV
  SRC --> SANDBOX
```

---

## 6. Domain model (class diagram)

Amplify Data models from `amplify/data/resource.ts` — associations only (fields abbreviated).

```mermaid
classDiagram
  direction TB

  class Category {
    +id
    +name slug
    +parentId
    +isActive isDeleted
  }

  class Product {
    +id
    +title price currency
    +categoryId
    +images tags
    +stockQty
  }

  class ProductSearchMeta {
    +id
    +productId
    +aiSummary aiTags aiSEO
    +language
  }

  class Cart {
    +id
    +userId
    +status
  }

  class CartItem {
    +id
    +cartId productId
    +quantity
    +priceSnapshot titleSnapshot
  }

  class Order {
    +id
    +userId orderNumber
    +status total currency
    +idempotencyKey
  }

  class OrderItem {
    +id
    +orderId productId
    +quantity
    +priceSnapshot titleSnapshot
  }

  class UserProfile {
    +id
    +userId email
    +addresses preferences
  }

  class SiteHero {
    +id
    +title subtitle
    +imageKey
  }

  Category "*" --> "0..1" Category : parent
  Category "1" --> "*" Product : products
  Product "1" --> "0..1" ProductSearchMeta : searchMeta

  Cart "1" --> "*" CartItem : items
  CartItem "*" --> "1" Product : product

  Order "1" --> "*" OrderItem : items
  OrderItem "*" --> "1" Product : product

  UserProfile "1" --> "*" Order : orders
```

---

## Diagram maintenance

- When you add Lambdas, models, or change `defineBackend`, update the matching diagram section (including **§6 class diagram**).
- If you add API Gateway REST APIs or Step Functions, introduce a new diagram — this stack is **GraphQL-centric** today.
