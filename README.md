# 🛍️ TealMart - Modern E-Commerce MVP

A production-ready, self-hosted e-commerce platform built with Next.js, PostgreSQL, and automated product ingestion.

## ✨ Features

### Core Features
- 🛒 **Full E-Commerce Storefront** - Product browsing, cart, and checkout
- 💳 **Payment Integration** - Stripe payments with secure checkout
- 📱 **Responsive Design** - Mobile-first UI with Tiffany blue & Katak branding
- 🔄 **Automated Product Ingestion** - Daily imports from multiple sources
- 💰 **Smart Pricing Engine** - Category-based markup and auto .99 pricing
- ⭐ **Quality Filtering** - Automatic filtering by rating (4.2+ default)
- 🎯 **Auto-Featured Products** - AI-driven product highlighting
- 📊 **Admin Dashboard** - Product management, orders, and analytics

### Technical Features
- ⚡ Next.js 14 App Router
- 🗄️ PostgreSQL with Prisma ORM
- 🎨 Tailwind CSS with custom brand colors
- 🔐 Secure authentication ready
- 📦 Docker & Docker Compose support
- ☁️ Vercel deployment ready
- 🤖 Python FastAPI ingestion service
- ⏰ Automated cron jobs

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Python 3.11+ (for ingestion service)
- Stripe account

### Local Development

1. **Clone and Install**
```bash
git clone <your-repo-url>
cd tealmart
npm install
```

2. **Set Up Environment Variables**
```bash
cp .env.example .env
# Edit .env with your credentials
```

Required environment variables:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/tealmart"
NEXTAUTH_SECRET="your-secret-key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
INGESTION_API_KEY="your-api-key"
```

3. **Set Up Database**
```bash
# Run Prisma migrations
npx prisma generate
npx prisma db push

# (Optional) Seed with sample data
npx prisma db seed
```

4. **Run Development Servers**

Terminal 1 - Next.js:
```bash
npm run dev
```

Terminal 2 - Ingestion Service:
```bash
cd ingestion
pip install -r requirements.txt
python main.py
```

5. **Access the Application**
- Storefront: http://localhost:3000
- Admin Dashboard: http://localhost:3000/admin
- Ingestion API: http://localhost:8000/docs

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

1. **Create Environment File**
```bash
cp .env.example .env
# Edit with production values
```

2. **Start All Services**
```bash
docker-compose up -d
```

This starts:
- PostgreSQL database
- Next.js web application
- Python ingestion service

3. **Initialize Database**
```bash
docker-compose exec web npx prisma db push
```

4. **Access Application**
- Web: http://localhost:3000
- Ingestion API: http://localhost:8000

### Stop Services
```bash
docker-compose down
```

## ☁️ Vercel Deployment

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Deploy to Vercel**
- Go to https://vercel.com
- Import your GitHub repository
- Vercel will auto-detect Next.js

3. **Configure Environment Variables**
Add these in Vercel dashboard:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random secret string
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `INGESTION_API_KEY`
- `CRON_SECRET` - For securing cron endpoints

4. **Set Up Database**
Use a managed PostgreSQL service:
- Vercel Postgres
- Supabase
- Railway
- Render

5. **Deploy Ingestion Service**
Deploy the `ingestion/` folder to:
- Railway
- Render
- Fly.io
- Any VPS

Update `INGESTION_SERVICE_URL` in Vercel env vars.

## 🔄 Product Ingestion

### Manual Ingestion
```bash
curl -X POST http://localhost:8000/ingest \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "sources": ["mock", "ebay", "aliexpress"],
    "count_per_source": 10
  }'
```

### Automated Ingestion
Cron jobs run automatically:
- **Daily at 2 AM**: Ingest new products
- **Daily at 3 AM**: Update featured products

Trigger manually:
```bash
curl http://localhost:3000/api/cron/ingest-products \
  -H "Authorization: Bearer your-cron-secret"
```

## 📊 Admin Features

### Access Admin Dashboard
Navigate to `/admin` to:
- View sales statistics
- Manage products (add, edit, disable)
- Process orders
- Configure pricing rules
- View analytics

### Pricing Rules
Edit pricing rules in the database:
```sql
INSERT INTO "PricingRule" (id, category, markup, min_rating, is_active)
VALUES (gen_random_uuid(), 'electronics', 1.35, 4.5, true);
```

## 🎨 Customization

### Brand Colors
Edit `tailwind.config.js`:
```javascript
colors: {
  tiffany: { ... },  // Primary buttons
  katak: { ... },    // Backgrounds
}
```

### Categories
Add/edit categories in `components/home/FeaturedCategories.tsx`

### Payment Methods
- Stripe: Configured by default
- PayPal: Uncomment in checkout page

## 📁 Project Structure

```
tealmart/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── products/          # Product pages
│   ├── cart/              # Shopping cart
│   └── checkout/          # Checkout flow
├── components/            # React components
│   ├── layout/           # Header, Footer
│   ├── products/         # Product cards, filters
│   └── home/             # Homepage sections
├── lib/                   # Utilities
│   ├── db.ts             # Prisma client
│   └── contexts/         # React contexts
├── prisma/               # Database schema
├── ingestion/            # Python ingestion service
│   ├── main.py          # FastAPI service
│   └── Dockerfile       # Container config
├── public/              # Static assets
└── docker-compose.yml   # Full stack deployment
```

## 🔐 Security

### Important Security Steps
1. Change all default passwords
2. Use strong `NEXTAUTH_SECRET`
3. Enable HTTPS in production
4. Use environment variables for secrets
5. Implement rate limiting
6. Add CAPTCHA to forms
7. Regular security updates

### API Security
- Ingestion API requires API key
- Cron endpoints require bearer token
- Admin routes need authentication (add NextAuth)

## 🧪 Testing

### Test Stripe Payments
Use test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

### Test Product Ingestion
```bash
# Get stats
curl http://localhost:8000/stats \
  -H "X-API-Key: your-api-key"

# Ingest mock products
curl -X POST http://localhost:8000/ingest \
  -H "X-API-Key: your-api-key" \
  -d '{"sources": ["mock"], "count_per_source": 20}'
```

## 📈 Scaling

### Database Optimization
- Add indexes for frequently queried fields
- Enable connection pooling
- Use read replicas for large catalogs

### Performance
- Enable Next.js image optimization
- Add CDN for static assets
- Implement Redis caching
- Use database query caching

### Multi-Vendor (Future)
Schema supports multi-vendor:
- Add `vendor_id` to products
- Create vendor dashboard
- Implement commission tracking

## 🛠️ Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL

# Reset database
npx prisma db push --force-reset
```

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Ingestion Service Issues
```bash
# Check logs
docker-compose logs ingestion

# Restart service
docker-compose restart ingestion
```

## 📝 License

MIT License - See LICENSE file

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📧 Support

For issues and questions:
- GitHub Issues: [Create an issue]
- Email: support@tealmart.com

---

Built with ❤️ for modern e-commerce
