// app/api/checkout/validate-discount/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json()
    if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 })

    const discount = await prisma.discountCode.findUnique({
      where: { code: code.toUpperCase() }
    })

    if (!discount || !discount.isActive) {
      return NextResponse.json({ error: "Invalid or inactive code" }, { status: 400 })
    }

    if (discount.validUntil && new Date(discount.validUntil) < new Date()) {
      return NextResponse.json({ error: "This code has expired" }, { status: 400 })
    }

    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
      return NextResponse.json({ error: "This code has reached its usage limit" }, { status: 400 })
    }

    if (discount.minPurchase && subtotal < discount.minPurchase) {
      return NextResponse.json({ error: `Minimum purchase of $${discount.minPurchase} required` }, { status: 400 })
    }

    let discountAmount = 0
    let message = ""

    if (discount.type === "PERCENTAGE") {
      discountAmount = subtotal * (discount.value / 100)
      message = `${discount.value}% off applied!`
    } else if (discount.type === "FIXED") {
      discountAmount = discount.value
      message = `$${discount.value} off applied!`
    } else if (discount.type === "FREE_SHIPPING") {
      discountAmount = 0 // Handled dynamically on frontend as Free Shipping
      message = "Free shipping applied!"
    }

    return NextResponse.json({
      valid: true,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      discountAmount,
      message
    })
  } catch (e) {
    return NextResponse.json({ error: "Validation failed" }, { status: 500 })
  }
}
