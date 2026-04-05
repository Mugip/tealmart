// app/api/checkout/shipping-options/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCJToken } from '@/lib/cjToken'

export async function POST(req: NextRequest) {
  console.log('\n================ CJ SHIPPING API START ================');
  try {
    const body = await req.json()
    const { items, country, zip } = body

    console.log('📦 1. Incoming Request Payload:', { country, zip, itemsCount: items?.length });

    if (!items || items.length === 0 || !country) {
      return NextResponse.json({ error: 'Missing items or country' }, { status: 400 })
    }

    const cjProducts = [];
    const token = await getCJToken();
    
    // 1. Resolve VIDs for CJ API
    for (const item of items) {
      const baseId = item.id.split('-')[0];
      const varId = item.id.split('-')[1]; // If user selected a variant in UI
      
      const dbProd = await prisma.product.findUnique({
        where: { id: baseId },
        select: { id: true, externalId: true, variants: true }
      });

      console.log(`🔍 2. DB Lookup for [${item.title}]:`, {
        cartVarId: varId || 'None',
        externalId: dbProd?.externalId || 'None',
        hasVariantsInDb: !!dbProd?.variants
      });

      let vid = varId;

      // Strategy A: Check DB variants if the cart doesn't have one
      if (!vid && dbProd?.variants) {
         const vData = dbProd.variants as any;
         let vList = [];
         if (Array.isArray(vData)) vList = vData;
         else if (vData?.items && Array.isArray(vData.items)) vList = vData.items;

         if (vList.length > 0) {
             vid = vList[0].id || vList[0].vid || vList[0].variantId || vList[0].sku;
             console.log(`   👉 Found VID in DB variants: ${vid}`);
         }
      }

      // Strategy B: Live Fetch from CJ if STILL no VID (Crucial for single-variant items)
      if (!vid && dbProd?.externalId) {
         console.log(`   ⚠️ No VID found in DB! Querying CJ API directly for PID: ${dbProd.externalId}...`);
         try {
             const detailRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${dbProd.externalId}`, {
                 headers: { 'CJ-Access-Token': token }
             });
             const detailData = await detailRes.json();
             
             if (detailData.code === 200 && detailData.data) {
                 const cjVars = detailData.data.variants || detailData.data.skuList || [];
                 if (cjVars.length > 0) {
                     vid = cjVars[0].vid || cjVars[0].variantId || cjVars[0].id || cjVars[0].sku;
                     console.log(`   ✅ Live CJ Fetch successful! Extracted true VID: ${vid}`);
                 } else {
                     console.log(`   ❌ CJ API returned no variants for this product. Data:`, JSON.stringify(detailData).substring(0, 200));
                 }
             }
         } catch (e) {
             console.error(`   ❌ Failed to fetch live VID from CJ:`, e);
         }
      }

      // Failsafe error mapping for local test products
      if (!vid && !dbProd?.externalId) {
         console.error(`   ❌ Product is a mock/seeded product without an externalId.`);
         return NextResponse.json({ error: `Item "${item.title}" is a test product and cannot be shipped via CJ Dropshipping.` }, { status: 400 })
      }

      if (vid) {
        cjProducts.push({
          quantity: parseInt(item.quantity) || 1,
          vid: String(vid)
        });
      } else {
         console.error(`❌ CRITICAL: Could not resolve ANY variant ID for product ${item.title}. Shipping will fail.`);
      }
    }

    console.log('🚀 3. Final Payload for CJ API:', JSON.stringify(cjProducts, null, 2));

    if (cjProducts.length === 0) {
       return NextResponse.json({ error: 'Could not resolve variant IDs for products. Shipping cannot be calculated.' }, { status: 400 })
    }

    // 2. Fetch Live Rates from CJ API
    const cjPayload = {
      startCountryCode: 'CN', 
      endCountryCode: country,
      zip: zip || '',
      products: cjProducts
    };

    console.log('🌐 4. Sending POST to CJ API /logistic/freightCalculate');
    
    const cjRes = await fetch('https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': token
      },
      body: JSON.stringify(cjPayload)
    });

    const cjRawText = await cjRes.text();
    console.log(`📥 5. CJ API Raw Response (HTTP Status: ${cjRes.status}):`, cjRawText);

    let cjData;
    try {
       cjData = JSON.parse(cjRawText);
    } catch (e) {
       console.error('❌ CJ returned invalid JSON');
       return NextResponse.json({ error: 'Supplier API is currently unreachable.' }, { status: 502 });
    }

    if (cjData.code === 200 && cjData.result === true && Array.isArray(cjData.data)) {
      console.log(`✅ 6. CJ API Success! Returned ${cjData.data.length} options.`);
      
      if (cjData.data.length === 0) {
        return NextResponse.json({ error: 'CJ returned 0 shipping methods for this destination.' }, { status: 400 });
      }

      const shippingOptions = cjData.data
        .sort((a: any, b: any) => a.logisticPrice - b.logisticPrice)
        .map((option: any) => {
          // White-label: Change "CJPacket" to "TealPacket"
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
            id: option.logisticName, // KEEP original name as ID to map properly when placing order
            displayName: displayName,
            tier: tier,
            icon: icon,
            price: option.logisticPrice, 
            estimatedDays: `${option.logisticAging} days`,
            description: `Tracked delivery via ${displayName}`
          }
        })
        
        console.log('=====================================================\n');
        return NextResponse.json({ shippingOptions })

    } else {
      console.error('❌ CJ API REJECTED REQUEST:', cjData);
      return NextResponse.json({ error: `CJ Error: ${cjData.message}` }, { status: 400 })
    }

  } catch (error: any) {
    console.error("❌ [SHIPPING_API_ERROR] Caught Exception:", error)
    console.log('=====================================================\n');
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' }, 
      { status: 500 }
    )
  }
          }
