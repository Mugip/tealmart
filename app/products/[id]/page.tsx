// app/products/[id]/page.tsx
// SERVER COMPONENT (SEO wrapper)
// The actual interactive UI lives in ProductPageClient.tsx

import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ProductPageClient from './ProductPageClient'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: {
      title: true,
      description: true,
      images: true,
      price: true,
      category: true,
      rating: true,
      reviewCount: true,
    },
  })

  if (!product) {
    return { title: 'Product Not Found | TealMart' }
  }

  const cleanDescription = product.description
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)

  return {
    title: `${product.title} | TealMart`,
    description: cleanDescription,
    openGraph: {
      title: product.title,
      description: cleanDescription,
      images: product.images[0]
        ? [{ url: product.images[0], width: 800, height: 800 }]
        : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: cleanDescription,
      images: product.images[0] ? [product.images[0]] : [],
    },
  }
}

// JSON-LD structured data for SEO
function ProductJsonLd({ product, id }: { product: any; id: string }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500),
    image: product.images,
    sku: id,
    brand: { '@type': 'Brand', name: 'TealMart' },
    offers: {
      '@type': 'Offer',
      url: `https://tealmart.vercel.app/products/${id}`,
      priceCurrency: 'USD',
      price: product.price.toFixed(2),
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'TealMart' },
    },
    ...(product.rating && product.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default async function ProductPage({ params }: Props) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      images: true,
      rating: true,
      reviewCount: true,
      stock: true,
    },
  })

  if (!product) notFound()

  return (
    <>
      <ProductJsonLd product={product} id={params.id} />
      <ProductPageClient params={params} />
    </>
  )
               }
