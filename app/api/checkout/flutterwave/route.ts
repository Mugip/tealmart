// app/api/checkout/flutterwave/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    // 1. Safety check for the API key
    if (!process.env.FLUTTERWAVE_SECRET_KEY) {
      console.error("❌ FLUTTERWAVE_SECRET_KEY is missing from environment variables.");
      return NextResponse.json({ 
        error: "Payment gateway is currently misconfigured. Please contact support or use Stripe." 
      }, { status: 500 })
    }

    const body = await req.json()
    const { items, email, shippingAddress, discountAmount, discountCode } = body

    console.log('📦 Flutterwave Checkout request:', { items: items?.length, email })

    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    // Validate shipping address
    if (!shippingAddress || typeof shippingAddress !== 'object') {
      return NextResponse.json({ error: "Shipping address is required" }, { status: 400 })
    }

    const requiredFields = ['name', 'address1', 'city', 'zip', 'phone']
    for (const field of requiredFields) {
      if (!shippingAddress[field]) {
        return NextResponse.json({ error: `${field} is required in shipping address` }, { status: 400 })
      }
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    // Fetch products from database securely
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
      })

      subtotal += dbPrice * quantity
    }

    if (validatedItems.length === 0) {
      return NextResponse.json({ error: "No valid products in cart" }, { status: 400 })
    }

    // Calculate shipping, tax, and total
    let finalDiscountAmount = discountAmount || 0;
    if (finalDiscountAmount > subtotal) finalDiscountAmount = subtotal; 
    
    const shipping = subtotal >= 50 ? 0 : 9.99
    const tax = 0 
    const total = subtotal + shipping + tax - finalDiscountAmount

    if (total <= 0) {
      return NextResponse.json({ error: "Order total must be greater than 0" }, { status: 400 })
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create order in database as PENDING
    const order = await prisma.order.create({
      data: {
        orderNumber,
        email,
        shippingName: shippingAddress.name,
        shippingAddress: shippingAddress.address1,
        shippingCity: shippingAddress.city,
        shippingState: shippingAddress.state || "",
        shippingZip: shippingAddress.zip,
        shippingCountry: shippingAddress.country || "UG",
        shippingPhone: shippingAddress.phone,
        paymentMethod: "flutterwave",
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
      }
    })

    console.log(`✅ Order created in DB (Pending Flutterwave): ${order.orderNumber}`)

    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/success?order=${order.orderNumber}`

    // Call Flutterwave API
    const flutterwaveResponse = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tx_ref: order.orderNumber,
        amount: Number(order.total.toFixed(2)),
        currency: "USD",
        redirect_url: redirectUrl,
        customer: {
          email: email,
          phonenumber: shippingAddress.phone,
          name: shippingAddress.name
        },
        customizations: {
          title: "TealMart Checkout",
          description: `Payment for Order ${order.orderNumber}`
        }
      })
    })

    const fwData = await flutterwaveResponse.json()

    // 2. Safe error handling from Flutterwave
    if (fwData.status === 'success' && fwData.data && fwData.data.link) {
      return NextResponse.json({ url: fwData.data.link })
    } else {
      console.error("❌ Flutterwave API Error:", fwData)
      throw new Error(fwData.message || "Invalid Flutterwave configuration or Authorization Key.")
    }

  } catch (error: any) {
    console.error("Flutterwave Checkout error:", error)
    return NextResponse.json({ 
      error: error.message || "Checkout failed" 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
  }
