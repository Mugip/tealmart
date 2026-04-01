// app/api/checkout/flutterwave/route.ts

import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// 🌍 Supported Flutterwave currencies
const SUPPORTED_CURRENCIES = [
  'USD', 'UGX', 'KES', 'NGN', 'GHS', 'ZAR', 'TZS', 'RWF', 'ZMW'
]

// 🌍 Country → Currency map
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  UG: 'UGX',
  KE: 'KES',
  NG: 'NGN',
  GH: 'GHS',
  ZA: 'ZAR',
  TZ: 'TZS',
  RW: 'RWF',
  ZM: 'ZMW'
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.FLUTTERWAVE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Payment gateway misconfigured" },
        { status: 500 }
      )
    }

    // 🌍 Fetch FX rates (ALL currencies)
    let rates: Record<string, number> = {}
    try {
      const fxRes = await fetch('https://open.er-api.com/v6/latest/USD', {
        next: { revalidate: 3600 },
      })
      const fxData = await fxRes.json()
      rates = fxData?.rates || {}
    } catch {
      console.warn("⚠️ FX fetch failed, fallback to USD")
    }

    const body = await req.json()
    const { items, email, shippingAddress, discountAmount, discountCode } = body

    // =============================
    // VALIDATION
    // =============================

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 })
    }

    if (!shippingAddress) {
      return NextResponse.json({ error: "Shipping required" }, { status: 400 })
    }

    if (!items?.length) {
      return NextResponse.json({ error: "Cart empty" }, { status: 400 })
    }

    // =============================
    // FETCH PRODUCTS
    // =============================

    const productIds = items.map((i: any) => i.id.split('-')[0])

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    })

    const productMap = new Map(products.map(p => [p.id, p]))

    let subtotal = 0
    const validatedItems: any[] = []

    for (const item of items) {
      const id = item.id.split('-')[0]
      const product = productMap.get(id)
      if (!product) continue

      const price = product.price
      const qty = item.quantity || 1

      subtotal += price * qty

      validatedItems.push({
        productId: product.id,
        quantity: qty,
        price,
      })
    }

    if (subtotal <= 0) {
      return NextResponse.json({ error: "Invalid total" }, { status: 400 })
    }

    // =============================
    // TOTAL CALCULATION
    // =============================

    const shipping = subtotal >= 50 ? 0 : 9.99
    const total = subtotal + shipping - (discountAmount || 0)

    // =============================
    // CREATE ORDER
    // =============================

    const orderNumber = `ORD-${Date.now()}`

    const order = await prisma.order.create({
      data: {
        orderNumber,
        email,
        shippingName: shippingAddress.name,
        shippingAddress: shippingAddress.address1,
        shippingCity: shippingAddress.city,
        shippingZip: shippingAddress.zip,
        shippingCountry: shippingAddress.country || "US",
        shippingPhone: shippingAddress.phone,
        paymentMethod: "flutterwave",
        status: "PENDING",
        subtotal,
        shipping,
        total,
        discountCode: discountCode || null,
        discountAmount: discountAmount || 0,
        items: {
          create: validatedItems
        }
      }
    })

    // =============================
    // 🌍 GLOBAL CURRENCY LOGIC
    // =============================

    const countryCode = (shippingAddress.country || 'US').toUpperCase()

    let currency =
      COUNTRY_CURRENCY_MAP[countryCode] || 'USD'

    // fallback if unsupported
    if (!SUPPORTED_CURRENCIES.includes(currency)) {
      currency = 'USD'
    }

    // convert amount if needed
    let chargeAmount = Number(order.total.toFixed(2))

    if (currency !== 'USD' && rates[currency]) {
      chargeAmount = Math.round(order.total * rates[currency])
    }

    // =============================
    // PAYMENT REQUEST
    // =============================

    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?order=${order.orderNumber}`

    const fwRes = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tx_ref: order.orderNumber,
        amount: chargeAmount,
        currency,
        payment_options:
          "card, mobilemoneyuganda, mobilemoneyghana, mobilemoneyrwanda, mpesa, ussd",
        redirect_url: redirectUrl,
        customer: {
          email,
          phonenumber: shippingAddress.phone,
          name: shippingAddress.name
        },
        customizations: {
          title: "TealMart Checkout",
          description: `Order ${order.orderNumber}`
        }
      })
    })

    const fwData = await fwRes.json()

    if (fwData?.data?.link) {
      return NextResponse.json({ url: fwData.data.link })
    }

    throw new Error("Failed to create payment link")

  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: err.message || "Checkout failed" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
                                  }
