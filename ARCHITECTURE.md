# 🏗️ TealMart - Architecture & Technical Overview

## Project Summary

TealMart is a production-ready, self-hosted e-commerce MVP built with modern technologies. It features automated product ingestion, smart pricing, and a beautiful storefront with secure payments.

## ✨ Key Features Implemented

### 🛒 E-Commerce Core
- ✅ Product catalog with filtering and search
- ✅ Shopping cart with persistent storage
- ✅ Secure checkout flow
- ✅ Stripe payment integration
- ✅ Order management system
- ✅ Responsive design (mobile-first)

### 🤖 Automation
- ✅ Automated product ingestion from multiple sources
- ✅ Smart pricing engine with category-based markup
- ✅ Auto .99 pricing
- ✅ Quality filtering (4.2+ rating default)
- ✅ Auto-feature top products
- ✅ Daily cron jobs for automation

### 👨‍💼 Admin Features
- ✅ Admin dashboard with analytics
- ✅ Product management
- ✅ Order tracking
- ✅ Pricing rule configuration
- ✅ Ingestion logs

### 🎨 Design
- ✅ Tiffany blue & Katak (milky tea) brand colors
- ✅ Modern, clean UI
- ✅ Trust badges and sections
- ✅ SEO-ready metadata
- ✅ Accessible components

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    TealMart Stack                    │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   Next.js   │  │  PostgreSQL  │  │   Stripe   │ │
│  │  Frontend   │──│   Database   │  │  Payments  │ │
│  │   & API     │  │  (Prisma)    │  │            │ │
│  └─────────────┘  └──────────────┘  └────────────┘ │
│         │                  │                         │
│         │                  │                         │
│  ┌──────────────────────────────────────────────┐  │
│  │        Python FastAPI Ingestion Service      │  │
│  │  - eBay Trending                             │  │
│  │  - AliExpress Popular                        │  │
│  │  - Mock Provider (fallback)                  │  │
│  └──────────────────────────────────────────────┘  │
│                                                       │
└─────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
tealmart/
├── 📱 app/                      # Next.js App Router
│   ├── api/                    # API Routes
│   │   ├── checkout/          # Stripe checkout
│   │   ├── cron/              # Automated jobs
│   │   ├── products/          # Product endpoints
│   │   └── health/            # Health check
│   ├── admin/                 # Admin dashboard
│   │   ├── page.tsx          # Dashboard home
│   │   └── products/         # Product management
│   ├── products/              # Product pages
│   │   ├── page.tsx          # Listing page
│   │   └── [id]/             # Detail pages
│   ├── cart/                  # Shopping cart
│   ├── checkout/              # Checkout flow
│   ├── success/               # Order confirmation
│   ├── about/                 # About page
│   ├── contact/               # Contact page
│   └── layout.tsx             # Root layout
│
├── 🎨 components/              # React Components
│   ├── layout/               # Header, Footer
│   ├── products/             # Product cards, filters
│   └── home/                 # Hero, categories
│
├── 🔧 lib/                     # Utilities
│   ├── db.ts                 # Prisma client
│   └── contexts/             # React Context
│       └── CartContext.tsx   # Cart state
│
├── 🗄️ prisma/                  # Database
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Sample data
│
├── 🐍 ingestion/               # Python Service
│   ├── main.py               # FastAPI app
│   ├── requirements.txt      # Dependencies
│   └── Dockerfile            # Container config
│
├── 🐳 Docker/                  # Deployment
│   ├── Dockerfile            # Next.js image
│   └── docker-compose.yml    # Full stack
│
├── 📝 Documentation
│   ├── README.md             # Main documentation
│   ├── DEPLOYMENT.md         # Deployment guide
│   └── QUICKSTART.md         # Quick start
│
└── ⚙️ Configuration
    ├── package.json          # Dependencies
    ├── tsconfig.json         # TypeScript
    ├── tailwind.config.js    # Styling
    ├── next.config.js        # Next.js
    ├── vercel.json           # Vercel config
    └── .env.example          # Environment template
```

## 🛢️ Database Schema

### Core Tables

**Products**
- Product information
- Images, pricing, ratings
- Categories and tags
- Source tracking
- View/conversion analytics

**Orders**
- Order details
- Customer information
- Shipping address
- Payment status
- Order items (relation)

**PricingRule**
- Category-based rules
- Markup percentages
- Minimum rating filters

**IngestionLog**
- Ingestion history
- Success/error tracking
- Performance metrics

**User**
- Authentication
- Admin permissions
- Order history

## 🔄 Data Flow

### Product Ingestion Flow

```
1. Cron Job Triggers (Daily 2 AM)
         ↓
2. Calls Ingestion Service API
         ↓
3. Fetches from Multiple Sources
   - eBay Trending
   - AliExpress Popular  
   - Mock Provider (fallback)
         ↓
4. Applies Pricing Rules
   - Category-based markup
   - Round to .99
   - Filter by rating (4.2+)
         ↓
5. Imports to Database
   - Create new products
   - Update existing
         ↓
6. Logs Results
   - Products added/updated
   - Errors encountered
```

### Checkout Flow

```
1. User adds items to cart
   (stored in localStorage)
         ↓
2. Navigate to checkout
   - Enter shipping info
         ↓
3. Submit checkout form
   - Create order in DB
   - Generate order number
         ↓
4. Create Stripe session
   - Line items from cart
   - Customer email
         ↓
5. Redirect to Stripe
   - Secure payment page
         ↓
6. Payment completed
   - Stripe webhook (optional)
   - Redirect to success page
         ↓
7. Show confirmation
   - Display order number
   - Clear cart
```

## 🔐 Security Features

### Implemented
- ✅ API key authentication for ingestion
- ✅ Stripe secure checkout
- ✅ Environment variable protection
- ✅ SQL injection prevention (Prisma ORM)
- ✅ CORS configuration
- ✅ Cron job authorization

### Recommended Additions
- 🔲 NextAuth for admin authentication
- 🔲 Rate limiting on API routes
- 🔲 CAPTCHA on forms
- 🔲 CSP headers
- 🔲 Input validation middleware

## 📊 Analytics & Monitoring

### Built-in Metrics
- Product views
- Product conversions
- Order totals
- Revenue tracking
- Ingestion success rates

### Admin Dashboard Shows
- Total products & active count
- Total orders
- Revenue
- Recent orders
- Product performance

## 🚀 Performance Optimizations

### Implemented
- ✅ Next.js Image optimization
- ✅ Static generation where possible
- ✅ Database indexing
- ✅ Incremental Static Regeneration
- ✅ Prisma query optimization

### Recommended
- 🔲 Redis caching layer
- 🔲 CDN for images
- 🔲 Database read replicas
- 🔲 Query result caching

## 🔧 Customization Points

### Easy to Customize
1. **Brand Colors** - `tailwind.config.js`
2. **Categories** - `components/home/FeaturedCategories.tsx`
3. **Pricing Rules** - Database `PricingRule` table
4. **Product Sources** - `ingestion/main.py`
5. **Email Templates** - Add in `lib/email.ts` (create)
6. **Shipping Rates** - `app/checkout/page.tsx`

### Extension Points
1. **Multi-vendor** - Schema ready, add vendor UI
2. **AI Descriptions** - Stub endpoint in ingestion service
3. **Affiliate Tracking** - Schema ready, add tracking code
4. **Inventory Management** - Extend Product model
5. **Customer Accounts** - Add with NextAuth
6. **Product Reviews** - Add Review model

## 📦 Deployment Options

### Option 1: Vercel (Recommended for MVP)
- ✅ Zero-config deployment
- ✅ Automatic HTTPS
- ✅ Built-in cron jobs
- ✅ Edge functions
- ⚠️ Separate ingestion service needed

### Option 2: Docker (VPS)
- ✅ Complete control
- ✅ All services in one place
- ✅ Cost-effective
- ⚠️ Requires server management

### Option 3: Hybrid
- Frontend: Vercel
- Database: Supabase/Railway
- Ingestion: Railway/Render
- ✅ Best of both worlds

## 🧪 Testing Strategy

### Manual Testing Checklist
- [ ] Browse products
- [ ] Add to cart
- [ ] Update quantities
- [ ] Checkout flow
- [ ] Stripe test payment
- [ ] Admin dashboard access
- [ ] Product ingestion
- [ ] Cron job execution

### Test Credentials
- Stripe Test Card: `4242 4242 4242 4242`
- Admin: Set in .env (ADMIN_EMAIL/PASSWORD)

## 📈 Scaling Considerations

### Current Capacity
- Handles 1000s of products
- 100s of concurrent users
- Daily automated updates

### To Scale Beyond
1. Add Redis caching
2. Implement CDN
3. Database connection pooling
4. Horizontal scaling (multiple instances)
5. Separate read/write databases
6. Queue system for ingestion (Bull/RabbitMQ)

## 🔄 CI/CD Recommendations

### GitHub Actions Workflow
```yaml
- Run tests
- Build Next.js
- Run Prisma migrations
- Deploy to Vercel/VPS
- Health check
```

## 📚 Technology Stack Details

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - API endpoints
- **Prisma** - ORM & type-safe database access
- **PostgreSQL** - Relational database
- **FastAPI (Python)** - Ingestion service

### Payments
- **Stripe** - Payment processing
- **Stripe Checkout** - Hosted checkout

### Infrastructure
- **Docker** - Containerization
- **Vercel** - Deployment platform (option 1)
- **Nginx** - Reverse proxy (VPS option)

## 🎯 Success Metrics

### MVP Goals
- ✅ Fully functional e-commerce site
- ✅ Automated product pipeline
- ✅ Secure payments
- ✅ Admin control panel
- ✅ Self-hostable
- ✅ Production-ready code

### Post-Launch KPIs
- Product catalog size
- Conversion rate
- Average order value
- Customer acquisition cost
- Revenue

## 🤝 Contributing

This is a complete MVP. To extend:

1. Fork repository
2. Create feature branch
3. Add tests
4. Submit pull request

## 📄 License

MIT License - Free to use and modify

---

**Built with ❤️ for modern e-commerce**

Version: 1.0.0
Last Updated: February 2026
