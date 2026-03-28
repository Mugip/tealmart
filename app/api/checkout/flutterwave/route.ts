// app/api/checkout/flutterwave/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { items, email, shippingAddress, discountAmount } = body

    // ... (Use the exact same validation and Subtotal calculation logic as the Stripe /api/checkout file here) ...
    // Calculate total
    const total = 50; // Replace with calculated total

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create Order in DB as "PENDING"
    const order = await prisma.order.create({
      data: {
        orderNumber,
        email,
        shippingName: shippingAddress.name,
        shippingAddress: shippingAddress.address1,
        shippingCity: shippingAddress.city,
        shippingState: shippingAddress.state,
        shippingZip: shippingAddress.zip,
        shippingCountry: shippingAddress.country,
        paymentMethod: "flutterwave",
        status: "PENDING",
        total: total,
        subtotal: total, // Simplified for example
        // items mapping...
      }
    })

    // Call Flutterwave API
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tx_ref: order.orderNumber,
        amount: order.total,
        currency: "USD", // Flutterwave supports USD or UGX
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/success?order=${order.orderNumber}`,
        customer: {
          email: email,
          phonenumber: shippingAddress.phone,
          name: shippingAddress.name
        },
        customizations: {
          title: "TealMart Checkout",
          description: "Payment for your order"
        }
      })
    })

    const data = await response.json()

    if (data.status === 'success') {
      return NextResponse.json({ url: data.data.link })
    } else {
      throw new Error(data.message)
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
