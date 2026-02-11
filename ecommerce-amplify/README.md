# E-Commerce Store - AWS Amplify Gen2

A modern, production-ready e-commerce store built with AWS Amplify Gen2, React, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Authentication**: User registration, login, and profile management with Cognito
- **Product Catalog**: Browse products by category with search and filtering
- **Shopping Cart**: Persistent cart for both guests and authenticated users
- **Checkout**: Multi-step checkout with address and payment collection
- **Order Management**: View order history and track order status
- **Admin Dashboard**: Manage products, categories, and orders
- **AI Product Enrichment**: Generate SEO-optimized product descriptions using OpenAI
- **Real-time Updates**: Live data synchronization with AppSync subscriptions

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** for styling
- **React Router** for navigation
- **AWS Amplify Client** for API and auth

### Backend (Amplify Gen2)
- **AppSync** GraphQL API
- **DynamoDB** for data storage
- **Cognito** for authentication
- **S3** for file storage
- **Lambda** for serverless functions

## 📁 Project Structure

```
ecommerce-amplify/
├── amplify/                    # Amplify Gen2 backend
│   ├── auth/                   # Authentication configuration
│   ├── data/                   # Data schema and models
│   ├── storage/                # S3 storage configuration
│   ├── functions/              # Lambda functions
│   │   ├── payments-webhook/   # Payment processing
│   │   ├── ai-enrich-product/  # AI product enhancement
│   │   ├── place-order/        # Order placement
│   │   └── shared/             # Shared utilities
│   └── backend.ts              # Main backend configuration
├── src/                        # Frontend source code
│   ├── components/             # Reusable components
│   │   ├── auth/               # Auth guards
│   │   ├── layout/             # Layout components
│   │   └── product/            # Product components
│   ├── lib/                    # Libraries and utilities
│   │   ├── api/                # API modules
│   │   ├── auth/               # Auth context
│   │   └── cart/               # Cart context
│   ├── pages/                  # Page components
│   │   ├── admin/              # Admin pages
│   │   └── ...                 # Public pages
│   ├── styles/                 # CSS styles
│   ├── App.tsx                 # Main app component
│   └── main.tsx                # Entry point
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- AWS Account with appropriate permissions
- AWS CLI configured with credentials

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ecommerce-amplify
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Initialize Amplify (if not already done):
   ```bash
   npx ampx sandbox
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Environment Setup

For the AI enrichment feature, add your OpenAI API key to AWS Secrets Manager:
```bash
aws secretsmanager create-secret \
  --name ecommerce/openai-api-key \
  --secret-string '{"apiKey":"your-openai-api-key"}'
```

For the payments webhook, configure your payment provider secret:
```bash
aws ssm put-parameter \
  --name /ecommerce/stripe-webhook-secret \
  --value "whsec_your_webhook_secret" \
  --type SecureString
```

## 📚 Data Models

### Category
- Product categories with images and descriptions
- Hierarchical structure with parent categories

### Product
- Full product information with pricing, inventory, and media
- SEO fields and search metadata
- Tags and custom attributes

### Cart & CartItem
- Shopping cart with line items
- Owner-based authorization

### Order & OrderItem
- Order tracking with status management
- Payment and shipping information
- Customer details

### UserProfile
- Extended user information
- Addresses and preferences

## 🔐 Authorization

- **Public**: Read access to products and categories
- **Customers**: Manage own cart and orders
- **Admins**: Full access to all data

## 📦 Deployment

Deploy to AWS with Amplify:
```bash
npx ampx pipeline-deploy --branch main --app-id YOUR_APP_ID
```

Or deploy sandbox for development:
```bash
npx ampx sandbox
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run e2e tests
npm run test:e2e
```

## 📝 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Check TypeScript types |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
