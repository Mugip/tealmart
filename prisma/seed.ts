import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10)
  
  await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@tealmart.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@tealmart.com',
      password: hashedPassword,
      name: 'Admin User',
      isAdmin: true,
    },
  })
  console.log('✅ Admin user created')

  // Create default pricing rules
  const categories = [
    { category: 'electronics', markup: 1.35, minRating: 4.5 },
    { category: 'fashion', markup: 1.40, minRating: 4.3 },
    { category: 'home-garden', markup: 1.30, minRating: 4.2 },
    { category: 'sports', markup: 1.35, minRating: 4.4 },
    { category: 'beauty', markup: 1.45, minRating: 4.5 },
    { category: 'toys', markup: 1.30, minRating: 4.2 },
  ]

  for (const rule of categories) {
    await prisma.pricingRule.upsert({
      where: { category: rule.category },
      update: {},
      create: rule,
    })
  }
  console.log('✅ Pricing rules created')

  // Create sample products
  const sampleProducts = [
    {
      title: 'Wireless Bluetooth Headphones - Premium Sound Quality',
      description: 'Experience crystal-clear audio with our premium wireless headphones. Features active noise cancellation, 30-hour battery life, and comfortable over-ear design.',
      price: 79.99,
      costPrice: 60.00,
      compareAtPrice: 99.99,
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
      category: 'electronics',
      tags: ['electronics', 'audio', 'wireless'],
      rating: 4.7,
      reviewCount: 328,
      source: 'seed',
      isActive: true,
      isFeatured: true,
      stock: 150,
    },
    {
      title: 'Smart Fitness Watch - Track Your Health',
      description: 'Monitor your fitness goals with this advanced smartwatch. Heart rate monitoring, sleep tracking, GPS, and 7-day battery life.',
      price: 129.99,
      costPrice: 95.00,
      compareAtPrice: 179.99,
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'],
      category: 'electronics',
      tags: ['electronics', 'fitness', 'smartwatch'],
      rating: 4.6,
      reviewCount: 512,
      source: 'seed',
      isActive: true,
      isFeatured: true,
      stock: 200,
    },
    {
      title: 'Organic Cotton T-Shirt - Comfortable & Sustainable',
      description: 'Soft, breathable organic cotton t-shirt. Available in multiple colors. Perfect for everyday wear.',
      price: 24.99,
      costPrice: 18.00,
      compareAtPrice: 34.99,
      images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'],
      category: 'fashion',
      tags: ['fashion', 'clothing', 'organic'],
      rating: 4.5,
      reviewCount: 156,
      source: 'seed',
      isActive: true,
      stock: 500,
    },
    {
      title: 'Yoga Mat - Non-Slip Premium Quality',
      description: 'Extra thick yoga mat with superior cushioning and grip. Perfect for yoga, pilates, and floor exercises.',
      price: 34.99,
      costPrice: 25.00,
      compareAtPrice: 49.99,
      images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800'],
      category: 'sports',
      tags: ['sports', 'fitness', 'yoga'],
      rating: 4.8,
      reviewCount: 423,
      source: 'seed',
      isActive: true,
      isFeatured: true,
      stock: 300,
    },
    {
      title: 'LED Desk Lamp - Adjustable & Eye-Caring',
      description: 'Modern LED desk lamp with adjustable brightness and color temperature. USB charging port included.',
      price: 39.99,
      costPrice: 30.00,
      compareAtPrice: 59.99,
      images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800'],
      category: 'home-garden',
      tags: ['home', 'lighting', 'desk'],
      rating: 4.6,
      reviewCount: 234,
      source: 'seed',
      isActive: true,
      stock: 180,
    },
  ]

  for (const product of sampleProducts) {
    await prisma.product.create({ data: product })
  }
  console.log('✅ Sample products created')

  console.log('🎉 Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
