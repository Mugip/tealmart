// app/api/orders/[id]/dispute/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToR2 } from '@/lib/r2'
import { openCJDispute } from '@/lib/cj/dispute'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'You must be signed in to request a return.' }, { status: 401 })
  }

  try {
    const { reason, description, images } = await req.json()

    if (!reason || !description) {
      return NextResponse.json({ error: 'Reason and description are required.' }, { status: 400 })
    }

    // 1. Verify the user owns this order
    const order = await prisma.order.findFirst({
      where: { orderNumber: params.id, email: session.user.email }
    })

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // 2. Check if a dispute already exists to prevent spam
    const existingDispute = await prisma.dispute.findFirst({
      where: { orderId: order.id }
    })

    if (existingDispute) {
      return NextResponse.json({ error: 'A return request is already open for this order.' }, { status: 400 })
    }

    // 3. Upload photo evidence to Cloudflare R2
    const uploadedImages: string[] = []
    if (Array.isArray(images)) {
      for (const base64 of images) {
        const matches = base64.match(/^data:(.+);base64,(.+)$/)
        if (!matches) continue
        const contentType = matches[1]
        const buffer = Buffer.from(matches[2], 'base64')
        const ext = contentType.includes('png') ? 'png' : 'jpg'
        const key = `disputes/${order.orderNumber}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`
        
        try {
          const url = await uploadToR2(buffer, key, contentType)
          uploadedImages.push(url)
        } catch (err) {
          console.error('R2 upload failed for dispute:', err)
        }
      }
    }

    // 4. Try to open the dispute with CJ Dropshipping automatically
    let cjDisputeId = null
    const cjOrder = await prisma.cJOrder.findUnique({ where: { orderId: order.id } })
    
    if (cjOrder && cjOrder.cjOrderNumber) {
      const cjResponse = await openCJDispute({
        orderNumber: cjOrder.cjOrderNumber,
        reason,
        description,
        images: uploadedImages
      })
      if (cjResponse.success) {
        cjDisputeId = cjResponse.disputeId
      }
    }

    // 5. Save the dispute to our database
    const dispute = await prisma.dispute.create({
      data: {
        orderId: order.id,
        cjOrderId: cjOrder?.cjOrderId,
        orderNumber: order.orderNumber,
        userEmail: session.user.email,
        reason,
        description: description.substring(0, 2000), // Limit length
        images: uploadedImages,
        cjDisputeId,
        status: 'PENDING',
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Return request submitted successfully. Our team will review it shortly.',
      dispute 
    })

  } catch (error: any) {
    console.error('[DISPUTE_CREATE_ERROR]', error)
    return NextResponse.json({ error: 'Failed to submit return request.' }, { status: 500 })
  }
}
