// lib/metadata.ts - FIXED
// SEO Metadata utilities for better search engine optimization

import { Metadata } from 'next'

export const siteConfig = {
  name: 'TealMart',
  description: 'Discover amazing products at unbeatable prices. Shop the latest trends from top brands with fast shipping and easy returns.',
  url: 'https://tealmart.vercel.app',
  ogImage: 'https://tealmart.vercel.app/og-image.png',
  links: {
    twitter: 'https://twitter.com/tealmart',
    tiktok: 'https://tiktok.com/tealmart',
    facebook: 'https://facebook.com/tealmart',
    instagram: 'https://instagram.com/tealmart',
  },
}

export function generateMetadata({
  title,
  description,
  image,
  noIndex = false,
}: {
  title?: string
  description?: string
  image?: string
  noIndex?: boolean
}): Metadata {
  return {
    title: title ? `${title} | ${siteConfig.name}` : siteConfig.name,
    description: description || siteConfig.description,
    keywords: [
      'online shopping',
      'e-commerce',
      'best prices',
      'quality products',
      'fast shipping',
      'easy returns',
      'trending products',
      'fashion',
      'electronics',
      'home goods',
    ],
    authors: [{ name: siteConfig.name }],
    creator: siteConfig.name,
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: siteConfig.url,
      title: title || siteConfig.name,
      description: description || siteConfig.description,
      siteName: siteConfig.name,
      images: [
        {
          url: image || siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: title || siteConfig.name,
      description: description || siteConfig.description,
      images: [image || siteConfig.ogImage],
      creator: '@tealmart',
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large', // ← FIXED: was string, now proper type
        'max-snippet': -1,
      },
    },
    verification: {
      google: 'your-google-verification-code',
      yandex: 'your-yandex-verification-code',
    },
  }
}

// Product-specific metadata generator
export function generateProductMetadata(product: {
  title: string
  description: string
  price: number
  images: string[]
  category: string
}) {
  return generateMetadata({
    title: product.title,
    description: product.description.slice(0, 160),
    image: product.images[0],
  })
}

// Category-specific metadata generator
export function generateCategoryMetadata(category: string, productCount: number) {
  const categoryName = category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return generateMetadata({
    title: `${categoryName} - ${productCount} Products`,
    description: `Shop ${productCount}+ products in ${categoryName}. Find the best deals on quality items with fast shipping and easy returns.`,
  })
}
