// app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import Stripe from "stripe"
import { sendOrderConfirmation } from '@/lib/email/sendOrderConfirmation'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover" as any,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { items, email, shippingAddress, discountAmount, discountCode, shippingCost, taxAmount } = body

    console.log('📦 Checkout request:', { items: items?.length, email, hasAddress: !!shippingAddress })

    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    // Validate shipping address
    if (!shippingAddress || typeof shippingAddress !== 'object') {
      return NextResponse.json({ error: "Shipping address is required" }, { status: 400 })
    }

    const requiredFields =['name', 'address1', 'city', 'state', 'zip', 'phone']
    for (const field of requiredFields) {
      if (!shippingAddress[field]) {
        return NextResponse.json({ error: `${field} is required in shipping address` }, { status: 400 })
      }
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    // Fetch products from database
    const productIds = items.map(item => item.id.split('-')[0])
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    })

    if (products.length === 0) {
      return NextResponse.json({ error: "No valid products found" }, { status: 400 })
    }

    // Validate and calculate totals securely from the Database
    const productMap = new Map(products.map(p => [p.id, p]))
    const validatedItems: any[] =[]
    let subtotal = 0

    for (const item of items) {
      const baseProductId = item.id.split('-')[0]
      const variantId = item.id.includes('-') ? item.id.split('-')[1] : null
      const product = productMap.get(baseProductId)
      
      if (!product) continue

      // Use database price, NOT the client's requested price
      let dbPrice = product.price

      // If a variant was selected, check if the variant has a different price
      if (variantId && product.variants && typeof product.variants === 'object') {
        const variantsData = product.variants as any
        if (variantsData.items && Array.isArray(variantsData.items)) {
          const variant = variantsData.items.find((v: any) => v.id === variantId)
          if (variant && variant.price) {
            dbPrice = variant.price
          }
        }
      }

      const quantity = item.quantity || 1

      validatedItems.push({
        productId: product.id,
        quantity,
        price: dbPrice,
        title: item.title || product.title,
        image: item.image || product.images[0],
      })

      subtotal += dbPrice * quantity
    }

    if (validatedItems.length === 0) {
      return NextResponse.json({ error: "No valid products in cart" }, { status: 400 })
    }

    // Handle Stripe Discounts securely
    let stripeDiscount: any = undefined;
    let finalDiscountAmount = 0;

    if (discountAmount && discountAmount > 0) {
      try {
        const coupon = await stripe.coupons.create({
          amount_off: Math.round(discountAmount * 100), // Convert to cents for Stripe
          currency: "usd",
          duration: "once",
        });
        stripeDiscount =[{ coupon: coupon.id }];
        finalDiscountAmount = discountAmount;
      } catch (e) {
        console.error("Failed to create Stripe coupon:", e);
      }
    }

    // Calculate shipping, tax, and total (Removed 10% hardcoded tax)
       // const shipping = subtotal >= 50 ? 0 : 9.99
      // const tax = 0 
    const shipping = typeof shippingCost === 'number' ? shippingCost : 9.99;
    const tax = typeof taxAmount === 'number' ? taxAmount : 0;
    const total = subtotal + shipping + tax - finalDiscountAmount

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      discounts: stripeDiscount,
      line_items: validatedItems.map(item => ({
        price_data: {
          currency: "usd",
          product_data: { 
            name: item.title,
            images: item.image ? [item.image] :[],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/checkout/cancel`,
      customer_email: email,
      metadata: {
        customerName: shippingAddress.name,
        customerEmail: email,
      },
    })

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create order in database
    const order = await prisma.order.create({
      data: {
        orderNumber,
        email,
        shippingName: shippingAddress.name,
        shippingAddress: shippingAddress.address1,
        shippingCity: shippingAddress.city,
        shippingState: shippingAddress.state,
        shippingZip: shippingAddress.zip,
        shippingCountry: shippingAddress.country || "US",
        shippingPhone: shippingAddress.phone,
        paymentMethod: "stripe",
        paymentId: session.id,
        status: "PENDING",
        subtotal,
        tax,
        shipping,
        total,
        discountCode: discountCode || null,
        discountAmount: finalDiscountAmount,
        items: {
          create: validatedItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    console.log(`✅ Order created: ${order.orderNumber}`)

    // Send order confirmation email
    try {
      await sendOrderConfirmation({
        id: order.id,
        customerEmail: order.email,
        customerName: order.shippingName,
        total: order.total,
        items: order.items.map(item => ({
          product: {
            title: item.product.title,
            price: item.product.price,
          },
          quantity: item.quantity,
          price: item.price,
        })),
        createdAt: order.createdAt,
      })
      console.log(`📧 Order confirmation email sent to ${order.email}`)
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Don't fail the order if email fails
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      orderId: order.id,
      orderNumber: order.orderNumber,
    })
  } catch (error: any) {
    console.error("Checkout error:", error)
    return NextResponse.json({ 
      error: error.message || "Checkout failed" 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
      }
