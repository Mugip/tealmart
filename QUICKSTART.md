# 🚀 TealMart - Quick Start Guide

Get TealMart running in 5 minutes!

## 📋 Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 15+ installed or hosted database ready
- [ ] Stripe account created
- [ ] Git installed

## ⚡ Quick Setup (Local)

### 1. Clone & Install (1 minute)

```bash
git clone <your-repo-url>
cd tealmart
npm install
```

### 2. Environment Setup (2 minutes)

```bash
cp .env.example .env
```

Edit `.env` - **Minimum required:**

```env
DATABASE_URL="postgresql://user:password@localhost:5432/tealmart"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_from_stripe_dashboard"
STRIPE_SECRET_KEY="sk_test_from_stripe_dashboard"
INGESTION_API_KEY="any-secure-random-string"
```

### 3. Database Setup (1 minute)

```bash
npx prisma db push
npm run db:seed  # Optional: adds sample products
```

### 4. Start Development (1 minute)

```bash
# Terminal 1
npm run dev

# Terminal 2 (Optional - for product ingestion)
cd ingestion
pip install -r requirements.txt
python main.py
```

**Done!** Visit http://localhost:3000 🎉

---

## 🌐 Quick Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/tealmart.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Add environment variables (same as .env)
4. Deploy!

### 3. Set Up Database

Use Vercel Postgres or Supabase:

```bash
# After database is ready
vercel env pull
npx prisma db push
npm run db:seed
```

**Live!** Your site is at https://your-project.vercel.app 🚀

---

## 🐳 Quick Deploy with Docker

### Local Docker Setup

```bash
# 1. Configure environment
cp .env.example .env
nano .env  # Edit DATABASE_URL and other values

# 2. Start everything
docker-compose up -d

# 3. Initialize database
docker-compose exec web npx prisma db push
docker-compose exec web npm run db:seed

# Done! Visit http://localhost:3000
```

### VPS Deployment

```bash
# On your VPS
git clone <your-repo>
cd tealmart
cp .env.example .env
nano .env  # Add production values

docker-compose up -d
docker-compose exec web npx prisma db push

# Set up nginx reverse proxy (see DEPLOYMENT.md)
```

---

## 🔑 Key URLs

| Service | Local | Production |
|---------|-------|------------|
| Storefront | http://localhost:3000 | https://your-domain.com |
| Admin Dashboard | http://localhost:3000/admin | https://your-domain.com/admin |
| Ingestion API | http://localhost:8000 | https://ingestion.your-domain.com |
| Database Studio | `npm run db:studio` | N/A |

---

## 🛠️ Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database

# Database
npx prisma db push       # Apply schema changes
npx prisma generate      # Regenerate Prisma client
npx prisma studio        # Database GUI

# Docker
docker-compose up -d     # Start all services
docker-compose logs -f   # View logs
docker-compose down      # Stop all services

# Ingestion
curl -X POST -H "X-API-Key: YOUR_KEY" \
  http://localhost:8000/ingest
```

---

## 🎨 Customization Quick Tips

### Change Brand Colors

Edit `tailwind.config.js`:
```javascript
tiffany: { 500: '#14b8a6' }  // Primary buttons
katak: { 300: '#ede7dc' }    // Backgrounds
```

### Add Products

1. Use admin dashboard at `/admin/products`
2. Or run ingestion: `curl -X POST http://localhost:8000/ingest -H "X-API-Key: YOUR_KEY"`
3. Or add manually in database

### Modify Categories

Edit `components/home/FeaturedCategories.tsx`

---

## 📊 Testing Payments

**Test Card:** 4242 4242 4242 4242
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

---

## ❓ Quick Troubleshooting

### Can't connect to database?
```bash
# Test connection
psql $DATABASE_URL

# Reset if needed
npx prisma db push --force-reset
```

### Build errors?
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Stripe not working?
- Check API keys in .env
- Verify test mode keys start with `pk_test_` and `sk_test_`
- Check Stripe dashboard for errors

### No products showing?
```bash
# Seed database
npm run db:seed

# Or ingest products
curl -X POST http://localhost:8000/ingest \
  -H "X-API-Key: YOUR_KEY"
```

---

## 📚 Next Steps

1. ✅ Read full [README.md](README.md) for features
2. 🚀 Read [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
3. 🎨 Customize brand colors and content
4. 💳 Switch to Stripe live mode for production
5. 📧 Set up email notifications (optional)
6. 📊 Add analytics (Google Analytics, etc.)

---

## 🆘 Need Help?

- **Documentation:** README.md, DEPLOYMENT.md
- **Issues:** GitHub Issues
- **Stripe:** https://stripe.com/docs
- **Vercel:** https://vercel.com/docs

---

**Happy selling! 🛍️**
