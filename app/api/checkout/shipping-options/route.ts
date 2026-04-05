// app/api/checkout/shipping-options/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCJToken } from '@/lib/cjToken'

export async function POST(req: NextRequest) {
  console.log('\n================ SHIPPING API CALLED ================');
  try {
    const body = await req.json()
    const { items, country, zip } = body

    console.log('1. Incoming Request Payload:', { country, zip, itemsCount: items?.length });
    console.log('Cart Items:', JSON.stringify(items, null, 2));

    if (!items || items.length === 0 || !country) {
      console.error('❌ Missing items or country');
      return NextResponse.json({ error: 'Missing items or country' }, { status: 400 })
    }

    // 1. Resolve VIDs for CJ API
    // CJ API strictly requires 'vid' (Variant ID), NOT 'pid' (Product ID).
    const cjProducts = [];
    
    for (const item of items) {
      const baseId = item.id.split('-')[0];
      const varId = item.id.split('-')[1]; // If they selected a variant, it's here
      
      const dbProd = await prisma.product.findUnique({
        where: { id: baseId },
        select: { id: true, externalId: true, variants: true }
      });

      console.log(`2. DB Lookup for Cart Item [${item.id}]:`, {
        found: !!dbProd,
        externalId: dbProd?.externalId,
        hasVariants: !!dbProd?.variants
      });

      let vid = varId;

      // If no explicit variant ID in cart, try to extract the FIRST variant's ID from the DB
      if (!vid && dbProd?.variants) {
         const variantsData = dbProd.variants as any;
         if (variantsData?.items && Array.isArray(variantsData.items) && variantsData.items.length > 0) {
             vid = variantsData.items[0].id;
             console.log(`   👉 No variant in cart. Extracted first variant VID from DB: ${vid}`);
         }
      }

      // If STILL no vid, maybe the externalId IS the vid (rare, but possible if simple product)
      if (!vid) {
         vid = dbProd?.externalId;
         console.log(`   👉 Still no VID, falling back to externalId (PID): ${vid}`);
      }

      if (vid) {
        cjProducts.push({
          quantity: parseInt(item.quantity) || 1,
          vid: String(vid)
        });
      } else {
         console.error(`❌ Could not resolve a VID for product ${item.title}`);
      }
    }

    console.log('3. Final Payload for CJ API:', JSON.stringify(cjProducts, null, 2));

    if (cjProducts.length === 0) {
       console.error('❌ CJ Products array is empty. Cannot fetch shipping.');
       return NextResponse.json({ error: 'Could not resolve supplier product IDs.' }, { status: 400 })
    }

    // 2. Fetch Live Rates from CJ API
    const token = await getCJToken()
    console.log('4. Obtained CJ Token:', token ? 'YES (Hidden for security)' : 'NO TOKEN!');

    const cjPayload = {
      startCountryCode: 'CN', // Assuming origin is China for standard dropshipping
      endCountryCode: country,
      zip: zip || '',
      products: cjProducts
    };

    console.log('5. Sending POST to CJ API /logistic/freightCalculate');
    console.log('CJ Payload:', JSON.stringify(cjPayload, null, 2));

    const cjRes = await fetch('https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': token
      },
      body: JSON.stringify(cjPayload)
    });

    const cjRawText = await cjRes.text();
    console.log(`6. CJ API Raw Response (HTTP Status: ${cjRes.status}):`, cjRawText);

    let cjData;
    try {
       cjData = JSON.parse(cjRawText);
    } catch (e) {
       console.error('❌ CJ API returned invalid JSON! Usually indicates a 502/504 error on their end.');
       return NextResponse.json({ error: 'Supplier API is currently unreachable.' }, { status: 502 });
    }

    if (cjData.code === 200 && cjData.result === true && Array.isArray(cjData.data)) {
      console.log(`7. CJ API Success! Returned ${cjData.data.length} shipping options.`);
      
      if (cjData.data.length === 0) {
        return NextResponse.json({ error: 'CJ returned 0 shipping methods for this destination/product combination.' }, { status: 400 });
      }

      const shippingOptions = cjData.data
        .sort((a: any, b: any) => a.logisticPrice - b.logisticPrice)
        .slice(0, 5) // Limit to top 5 options
        .map((option: any) => {
          // Replace 'CJ' with 'Teal' to white-label the shipping methods
          const displayName = option.logisticName.replace(/CJ/gi, 'Teal')
          let tier = 'standard'
          let icon = '📦'
          const nameLower = displayName.toLowerCase()
          
          if (nameLower.includes('fast') || nameLower.includes('express') || nameLower.includes('dhl') || nameLower.includes('fedex')) {
            tier = 'express'; icon = '🚀';
          } else if (nameLower.includes('sensitive') || nameLower.includes('special')) {
            icon = '🛡️';
          }

          return {
            id: option.logisticName, // KEEP original name as ID so we can pass it back to CJ on order creation
            displayName: displayName,
            tier: tier,
            icon: icon,
            price: option.logisticPrice, 
            estimatedDays: `${option.logisticAging} days`,
            description: `Tracked delivery via ${displayName}`
          }
        })
        
        console.log('8. Returning mapped options to client successfully.');
        console.log('=====================================================\n');
        return NextResponse.json({ shippingOptions })

    } else {
      console.error('❌ CJ API Error Block Reached:', cjData);
      return NextResponse.json({ error: cjData.message || 'Failed to fetch shipping rates from supplier.' }, { status: 400 })
    }

  } catch (error: any) {
    console.error("❌ [SHIPPING_API_ERROR] Caught Exception:", error)
    console.log('=====================================================\n');
    return NextResponse.json(
      { error: error.message || 'Internal Server Error calculating shipping' }, 
      { status: 500 }
    )
  }
}
