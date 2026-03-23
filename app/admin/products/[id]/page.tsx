// app/admin/products/[id]/page.tsx - PRODUCT EDIT
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import ProductEditForm from '@/components/admin/ProductEditForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function ProductEditPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
  })

  if (!product) {
    notFound()
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin/products"
          className="inline-flex items-center text-tiffany-600 hover:text-tiffany-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Edit Product</h1>
          <p className="text-sm lg:text-base text-gray-600">Update product information and settings</p>
        </div>

        <ProductEditForm product={product} />
      </div>
    </div>
  )
}
