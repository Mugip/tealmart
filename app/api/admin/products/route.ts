// app/api/admin/products/route.ts
// CREATE NEW PRODUCT

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/adminAuth'

export async function POST(request: NextRequest) {
  const token = cookies().get('admin-auth')?.value

  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const data = await request.json()

    if (!data.title || data.price === undefined) {
      return NextResponse.json(
        { error: 'Title and price are required' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        title: data.title,
        description: data.description || '',
        price: parseFloat(data.price),
        costPrice: data.costPrice
          ? parseFloat(data.costPrice)
          : null,
        compareAtPrice: data.compareAtPrice
          ? parseFloat(data.compareAtPrice)
          : null,
        stock: parseInt(data.stock) || 0,
        category: data.category || 'Uncategorized',
        tags: data.tags || [],
        images: data.images || [],
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        source: 'manual',
      },
    })

    return NextResponse.json(
      {
        success: true,
        product,
        message: 'Product created successfully',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Create product error:', error)

    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    )
  }
}
