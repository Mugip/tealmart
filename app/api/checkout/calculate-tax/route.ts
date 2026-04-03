// app/api/checkout/calculate-tax/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { subtotal, shipping, country, state } = await request.json()

    let taxRate = 0

    // Basic Example Rules:
    // If you want to charge tax in specific regions, define them here.
    // E.g., Charge 8% tax if shipping to California
    if (country === 'US' && state === 'CA') {
      taxRate = 0.08 
    } 
    // E.g., Charge 20% VAT for UK
    else if (country === 'GB') {
      taxRate = 0.20
    }

    // Tax is usually calculated on (Subtotal + Shipping) depending on local laws
    const taxableAmount = subtotal + (shipping || 0)
    const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100

    return NextResponse.json({
      taxAmount,
      rate: taxRate,
      region: `${country}-${state}`
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to calculate tax' },
      { status: 500 }
    )
  }
}
