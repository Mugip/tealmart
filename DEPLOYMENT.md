# 🚀 TealMart Deployment Guide

Complete step-by-step guide for deploying TealMart to production.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Vercel Deployment](#vercel-deployment)
4. [VPS Deployment with Docker](#vps-deployment-with-docker)
5. [Database Setup](#database-setup)
6. [Stripe Configuration](#stripe-configuration)
7. [Ingestion Service Deployment](#ingestion-service-deployment)
8. [Automation & Cron Jobs](#automation--cron-jobs)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- [ ] GitHub account
- [ ] Vercel account (for Vercel deployment)
- [ ] Stripe account (for payments)
- [ ] Database hosting (Vercel Postgres, Supabase, or Railway)

### Local Requirements
- Node.js 18 or higher
- PostgreSQL 15 or higher
- Python 3.11 or higher (for ingestion service)
- Git

---

## Local Development Setup

### Step 1: Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd tealmart

# Run the setup script (recommended)
chmod +x setup.sh
./setup.sh

# OR manually:
npm install
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required Environment Variables:**

```env
# Database - Use your local PostgreSQL or hosted service
DATABASE_URL="postgresql://user:password@localhost:5432/tealmart"

# NextAuth - Generate a random secret
NEXTAUTH_SECRET="your-long-random-secret-string-here"
NEXTAUTH_URL="http://localhost:3000"

# Stripe - Get from https://dashboard.stripe.com/test/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."

# Ingestion Service
INGESTION_API_KEY="create-a-secure-api-key"

# App Config
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="TealMart"

# Admin (for initial setup)
ADMIN_EMAIL="admin@tealmart.com"
ADMIN_PASSWORD="changeme123"
```

### Step 3: Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with sample data
npm run db:seed
```

### Step 4: Start Development

```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start Ingestion Service
cd ingestion
pip install -r requirements.txt
python main.py
```

Visit http://localhost:3000 🎉

---

## Vercel Deployment

### Step 1: Prepare Repository

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial TealMart commit"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/tealmart.git
git push -u origin main
```

### Step 2: Create Vercel Project

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Vercel will auto-detect Next.js

### Step 3: Configure Database

**Option A: Vercel Postgres (Recommended)**

1. In Vercel dashboard → Storage → Create Database
2. Choose Postgres
3. Copy connection string

**Option B: External Database**

Use one of these providers:
- **Supabase**: https://supabase.com (Free tier available)
- **Railway**: https://railway.app (Generous free tier)
- **Neon**: https://neon.tech (Serverless Postgres)

### Step 4: Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
INGESTION_API_KEY=your-api-key
CRON_SECRET=your-cron-secret
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

**Generate Secrets:**
```bash
# For NEXTAUTH_SECRET and CRON_SECRET
openssl rand -base64 32
```

### Step 5: Initialize Database

```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Run migrations
vercel env pull .env.production
npx prisma db push

# Seed database (optional)
npm run db:seed
```

### Step 6: Deploy

```bash
# Deploy to production
vercel --prod
```

Your site is now live! 🚀

---

## VPS Deployment with Docker

### Step 1: Server Requirements

- Ubuntu 22.04 or similar
- 2GB+ RAM
- 20GB+ storage
- Docker & Docker Compose installed

### Step 2: Install Docker

```bash
# On your VPS
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose
```

### Step 3: Clone Project

```bash
git clone <your-repo-url>
cd tealmart
```

### Step 4: Configure Environment

```bash
cp .env.example .env
nano .env
```

Update with production values:
```env
DATABASE_URL="postgresql://tealmart:STRONG_PASSWORD@postgres:5432/tealmart"
DB_PASSWORD="STRONG_PASSWORD"  # Same as above
APP_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret"
# ... other production values
```

### Step 5: Build and Start

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Initialize database
docker-compose exec web npx prisma db push
docker-compose exec web npm run db:seed
```

### Step 6: Set Up Nginx Reverse Proxy

```bash
sudo apt install nginx

# Create nginx config
sudo nano /etc/nginx/sites-available/tealmart
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/tealmart /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Database Setup

### Hosted PostgreSQL Providers

#### Supabase (Recommended for Vercel)

1. Create project at https://supabase.com
2. Go to Settings → Database
3. Copy connection string (Direct)
4. Add `?pgbouncer=true` to connection string
5. Use this as DATABASE_URL

#### Railway

1. Create project at https://railway.app
2. Add PostgreSQL database
3. Copy connection string
4. Use as DATABASE_URL

#### Neon

1. Create project at https://neon.tech
2. Copy connection string
3. Use as DATABASE_URL

---

## Stripe Configuration

### Step 1: Create Stripe Account

1. Sign up at https://stripe.com
2. Verify your email

### Step 2: Get API Keys

1. Go to Developers → API Keys
2. Copy Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Copy Secret key → `STRIPE_SECRET_KEY`

### Step 3: Set Up Webhooks (Production)

1. Go to Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
4. Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET`

### Step 4: Test Mode

Use test keys for development:
- Publishable: `pk_test_...`
- Secret: `sk_test_...`

Test card: `4242 4242 4242 4242`

---

## Ingestion Service Deployment

### Option 1: Deploy with Main App (Docker)

Already included in docker-compose.yml - runs automatically!

### Option 2: Deploy Separately

#### Railway

```bash
cd ingestion

# Create railway.json
echo '{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}' > railway.json

# Deploy with Railway CLI
railway login
railway init
railway up
```

#### Render

1. Create account at https://render.com
2. New → Web Service
3. Connect repository
4. Root Directory: `ingestion`
5. Build Command: `pip install -r requirements.txt`
6. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
7. Add environment variables

### Update Main App

After deploying ingestion service, update main app:

```env
INGESTION_SERVICE_URL="https://your-ingestion-service.com"
```

---

## Automation & Cron Jobs

### Vercel Cron (Automatic)

Already configured in `vercel.json`:
- Runs daily at 2 AM: Product ingestion
- Runs daily at 3 AM: Update featured products

### Manual Cron (VPS)

```bash
# Edit crontab
crontab -e

# Add these lines:
0 2 * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/ingest-products
0 3 * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/update-featured
```

### Test Cron Jobs

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/cron/ingest-products
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL

# Reset database
npx prisma db push --force-reset
```

### Build Errors on Vercel

1. Check build logs in Vercel dashboard
2. Ensure all environment variables are set
3. Try manual build:
   ```bash
   npm run build
   ```

### Docker Issues

```bash
# View logs
docker-compose logs web
docker-compose logs ingestion

# Restart services
docker-compose restart

# Rebuild
docker-compose up -d --build
```

### Stripe Payment Issues

1. Check Stripe dashboard for error logs
2. Verify API keys are correct
3. Test with test card: 4242 4242 4242 4242
4. Check webhook endpoint is accessible

### Ingestion Not Working

```bash
# Check service health
curl http://localhost:8000/

# View ingestion stats
curl -H "X-API-Key: YOUR_API_KEY" \
  http://localhost:8000/stats

# Manual ingestion
curl -X POST -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sources": ["mock"], "count_per_source": 10}' \
  http://localhost:8000/ingest
```

---

## Post-Deployment Checklist

- [ ] Site loads correctly
- [ ] Products are visible
- [ ] Cart functionality works
- [ ] Checkout flow completes
- [ ] Stripe payment processes
- [ ] Admin dashboard accessible
- [ ] Cron jobs running
- [ ] SSL certificate valid
- [ ] Analytics configured (optional)
- [ ] Domain configured
- [ ] Email notifications working (optional)

---

## Support

Need help? Check:
- README.md for general info
- GitHub Issues for bug reports
- Vercel docs: https://vercel.com/docs
- Stripe docs: https://stripe.com/docs

---

**Congratulations! TealMart is now live! 🎉**
