// app/api/checkout/shipping-options/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { items, country, zip } = body

    if (!items || items.length === 0 || !country) {
      return NextResponse.json({ error: 'Missing items or country' }, { status: 400 })
    }

    // Calculate base shipping (e.g., $9.99 flat, free over certain amount)
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    
    let standardPrice = 9.99
    let expressPrice = 24.99

    // Free shipping over $50
    if (subtotal >= 50) {
      standardPrice = 0
    }

    // Adjust for international
    if (country !== 'US' && country !== 'UG') {
      standardPrice += 10
      expressPrice += 15
    }

    // Provide standard fallback options to ensure checkout ALWAYS works
    const shippingOptions = [
      {
        id: 'standard_shipping',
        displayName: 'Standard Shipping',
        tier: 'standard',
        icon: '📦',
        price: standardPrice,
        estimatedDays: '7-14 days',
        description: 'Reliable standard delivery with tracking'
      },
      {
        id: 'express_shipping',
        displayName: 'Express Delivery',
        tier: 'express',
        icon: '🚀',
        price: expressPrice,
        estimatedDays: '3-7 days',
        description: 'Fast track priority delivery'
      }
    ]

    return NextResponse.json({ shippingOptions })

  } catch (error) {
    console.error("[SHIPPING_API_ERROR]", error)
    return NextResponse.json(
      { error: 'Failed to calculate shipping' }, 
      { status: 500 }
    )
  }
}
