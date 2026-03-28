// app/products/[id]/page.tsx
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
      images: product.images[0] ? [{ url: product.images[0], width: 800, height: 800 }] :[],
      type: 'website',
    },
  }
}

export default async function ProductPage({ params }: Props) {
  // SERVER-SIDE FETCH: Zero loading spinners on the client!
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      compareAtPrice: true,
      images: true,
      rating: true,
      reviewCount: true,
      stock: true,
      category: true,
      tags: true,
      variants: true,
    },
  })

  if (!product) notFound()

  // Increment views silently in the background
  prisma.product.update({
    where: { id: params.id },
    data: { views: { increment: 1 } },
  }).catch(() => {})

  return (
    <>
      <ProductPageClient initialProduct={product} />
    </>
  )
}
