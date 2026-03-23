// app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

// GET - Get product details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },                           })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })                                 }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })                           }
}
                                                      // PUT - Update product
export async function PUT(                              request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const cookieStore = cookies()                         const adminAuth = cookieStore.get('admin-auth')

    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }                                                 
    const data = await request.json()

    // Validate required fields
    if (!data.title || !data.price) {
      return NextResponse.json(
        { error: 'Title and price are required' },
        { status: 400 }                                     )
    }                                                 
    // Update product
    const product = await prisma.product.update({           where: { id: params.id },                             data: {
        title: data.title,
        description: data.description,
        price: parseFloat(data.price),
        costPrice: data.costPrice ? parseFloat(data.costPrice) : null,
        compareAtPrice: data.compareAtPrice ? parseFloat(data.compareAtPrice) : null,
        stock: parseInt(data.stock),                          category: data.category,
        isActive: data.isActive,
        isFeatured: data.isFeatured,                          updatedAt: new Date(),
      },
    })
                                                          console.log(`✅ Product ${product.id} updated successfully`)                                                                                                      return NextResponse.json({                              success: true,                                        product,
      message: 'Product updated successfully',
    })
  } catch (error: any) {                                  console.error('Update product error:', error)
    return NextResponse.json(                               { error: error.message || 'Failed to update product' },
      { status: 500 }
    )                                                   }
}                                                     
// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {                                                     try {                                                   // Check admin authentication
    const cookieStore = cookies()                         const adminAuth = cookieStore.get('admin-auth')
                                                          if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
                                                          // Check if product exists
    const product = await prisma.product.findUnique({       where: { id: params.id },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
                                                          // Delete product
    await prisma.product.delete({                           where: { id: params.id },
    })                                                
    console.log(`✅ Product ${params.id} deleted successfully`)                                             
    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    })
  } catch (error: any) {                                  console.error('Delete product error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    )
  }
}
