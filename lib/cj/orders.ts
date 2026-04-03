// lib/cj/orders.ts
import { cjClient } from './client'
import { prisma } from '@/lib/db'

export async function pushOrderToCJ(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  })

  if (!order) throw new Error('Order not found')

  // 1. Check if we already pushed this to CJ to prevent duplicate ordering!
  const existing = await prisma.cJOrder.findUnique({ where: { orderId } })
  if (existing) return existing

  // 2. Format products
  const cjProducts = order.items.map(item => ({
    // If no variant selected, fallback to the main product's externalId
    vid: item.id.includes('-') ? item.id.split('-')[1] : item.product.externalId!,
    quantity: item.quantity,
    sellPrice: item.price,
  }))

  // 3. We saved the shippingMethod ID (e.g., 'CJ_Packet_Ordinary') in the order metadata
  // If missing, default to the safest standard option
  const shippingMethod = (order as any).shippingMethodId || 'CJ_Packet_Ordinary'

  // 4. Send to CJ
  const cjOrderResponse = await cjClient.createOrder({
    orderNumber: order.orderNumber,
    shippingMethod,
    products: cjProducts,
    shippingAddress: {
      name: order.shippingName,
      phone: order.shippingPhone || '0000000000',
      country: order.shippingCountry,
      province: order.shippingState,
      city: order.shippingCity,
      address: order.shippingAddress,
      zip: order.shippingZip,
    },
    remark: `TealMart Order ${order.orderNumber}`,
  })

  // 5. Save the CJ relation in our Database
  const cjOrder = await prisma.cJOrder.create({
    data: {
      orderId: order.id,
      cjOrderNumber: cjOrderResponse.orderNumber,
      cjOrderId: cjOrderResponse.cjOrderId,
      products: cjProducts,
      shippingMethod,
      shippingCost: order.shipping, // We'll update this to real cost during reconciliation
      shippingCharged: order.shipping,
      totalPaid: order.total,
      cjPaymentAmount: order.subtotal + order.shipping,
      platformFee: 0, 
      profit: 0, 
      status: 'CONFIRMED',
      cjStatus: 'CREATED',
      shippingAddress: {
        name: order.shippingName,
        address: order.shippingAddress,
        city: order.shippingCity,
        state: order.shippingState,
        zip: order.shippingZip,
        country: order.shippingCountry,
        phone: order.shippingPhone,
      },
    }
  })

  return cjOrder
}
