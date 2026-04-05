// app/api/checkout/shipping-options/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCJToken } from '@/lib/cjToken'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { items, country, zip } = body

    if (!items || items.length === 0 || !country) {
      return NextResponse.json({ error: 'Missing items or country' }, { status: 400 })
    }

    // 1. Resolve VIDs for CJ API
    // The cart item IDs are stored as "productId-variantId" or just "productId"
    const productIds = items.map((i: any) => i.id.split('-')[0])
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, externalId: true }
    })

    const cjProducts = items.map((item: any) => {
      const baseId = item.id.split('-')[0];
      const varId = item.id.split('-')[1];
      const dbProd = dbProducts.find((p) => p.id === baseId);
      
      // If there's a specific variant ID, use it. Otherwise fallback to the base product's externalId (which is the CJ Product ID)
      const vid = varId || dbProd?.externalId;
      
      return {
        quantity: item.quantity,
        vid: vid
      }
    }).filter((p: any) => p.vid) // Ensure we only send valid VIDs

    let shippingOptions = []

    // 2. Fetch Live Rates from CJ API
    if (cjProducts.length > 0) {
      try {
        const token = await getCJToken()
        
        console.log('[SHIPPING_API] Requesting CJ Rates for:', { country, zip, cjProducts })

        const cjRes = await fetch('https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CJ-Access-Token': token
          },
          body: JSON.stringify({
            startCountryCode: 'CN', // Assuming dropshipping inventory originates from CN
            endCountryCode: country,
            zip: zip || '',
            products: cjProducts
          })
        })

        const cjData = await cjRes.json()

        if (cjData.code === 200 && Array.isArray(cjData.data) && cjData.data.length > 0) {
          // Map CJ data to our TealMart shipping options format
          shippingOptions = cjData.data
            // Sort by price ascending to show cheapest first
            .sort((a: any, b: any) => a.logisticPrice - b.logisticPrice)
            // Take the 4 best/cheapest options to not overwhelm the user
            .slice(0, 4)
            .map((option: any) => {
              // ✨ MAGIC: Swap 'CJ' with 'Teal' to mask the supplier!
              const displayName = option.logisticName.replace(/CJ/gi, 'Teal')
              
              // Determine visual tier & icon
              let tier = 'standard'
              let icon = '📦'
              const nameLower = displayName.toLowerCase()
              
              if (nameLower.includes('fast') || nameLower.includes('express') || nameLower.includes('dhl') || nameLower.includes('fedex')) {
                tier = 'express'
                icon = '🚀'
              } else if (nameLower.includes('sensitive') || nameLower.includes('special')) {
                icon = '🛡️'
              }

              return {
                id: option.logisticName, // KEEP original name as ID so we can pass it back to CJ when placing the order later!
                displayName: displayName,
                tier: tier,
                icon: icon,
                // Add a small markup to cover processing fees (e.g. + 15% padding), or pass it raw. Let's pass raw for exact matching.
                price: option.logisticPrice, 
                estimatedDays: `${option.logisticAging} days`,
                description: `Tracked delivery via ${displayName}`
              }
            })
        } else {
          console.warn('[SHIPPING_API] CJ API returned no options or error:', cjData)
        }
      } catch (cjError) {
        console.error('[SHIPPING_API] Failed to fetch from CJ API:', cjError)
      }
    }

    // 3. Robust Fallback Logic 
    // If CJ returns empty (e.g. restricted zip code) or API times out, ensure the customer can STILL checkout!
    if (shippingOptions.length === 0) {
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
      let standardPrice = subtotal >= 50 ? 0 : 9.99
      let expressPrice = 24.99

      if (country !== 'US' && country !== 'UG') {
        standardPrice += 10
        expressPrice += 15
      }

      shippingOptions = [
        {
          id: 'Teal_Packet_Ordinary',
          displayName: 'Standard Delivery',
          tier: 'standard',
          icon: '📦',
          price: standardPrice,
          estimatedDays: '7-14 days',
          description: 'Reliable standard delivery with tracking'
        },
        {
          id: 'Teal_Packet_Fast',
          displayName: 'Express Delivery',
          tier: 'express',
          icon: '🚀',
          price: expressPrice,
          estimatedDays: '3-7 days',
          description: 'Fast track priority delivery'
        }
      ]
    }

    return NextResponse.json({ shippingOptions })

  } catch (error) {
    console.error("[SHIPPING_API_ERROR]", error)
    // We catch structural errors but still return 500, which the UI wrapper we fixed earlier will gracefully catch.
    return NextResponse.json(
      { error: 'Failed to calculate shipping' }, 
      { status: 500 }
    )
  }
            }
