// app/api/checkout/shipping-options/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCJToken } from '@/lib/cjToken'

export async function POST(req: NextRequest) {
  console.log('\n================ CJ SHIPPING API START ================');
  try {
    const body = await req.json()
    const { items, country, zip } = body

    if (!items || items.length === 0 || !country) {
      return NextResponse.json({ error: 'Missing items or country' }, { status: 400 })
    }

    const cjProducts = [];
    const token = await getCJToken();
    
    // 1. Resolve VIDs for CJ API
    for (const item of items) {
      const baseId = item.id.split('-')[0];
      const varId = item.id.split('-')[1]; 
      
      const dbProd = await prisma.product.findUnique({
        where: { id: baseId },
        select: { id: true, externalId: true, variants: true }
      });

      let vid = varId;

      if (!vid && dbProd?.variants) {
         const vData = dbProd.variants as any;
         let vList = [];
         if (Array.isArray(vData)) vList = vData;
         else if (vData?.items && Array.isArray(vData.items)) vList = vData.items;

         if (vList.length > 0) {
             vid = vList[0].id || vList[0].vid || vList[0].variantId || vList[0].sku;
         }
      }

      if (!vid && dbProd?.externalId) {
         try {
             const detailRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${dbProd.externalId}`, {
                 headers: { 'CJ-Access-Token': token }
             });
             const detailData = await detailRes.json();
             
             if (detailData.code === 200 && detailData.data) {
                 const cjVars = detailData.data.variants || detailData.data.skuList || [];
                 if (cjVars.length > 0) {
                     vid = cjVars[0].vid || cjVars[0].variantId || cjVars[0].id || cjVars[0].sku;
                 }
             }
         } catch (e) {}
      }

      if (!vid && !dbProd?.externalId) {
         return NextResponse.json({ error: `Item "${item.title}" is a test product and cannot be shipped via CJ Dropshipping.` }, { status: 400 })
      }

      if (vid) {
        cjProducts.push({
          quantity: parseInt(item.quantity) || 1,
          vid: String(vid)
        });
      }
    }

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
    
    const cjRes = await fetch('https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': token
      },
      body: JSON.stringify(cjPayload)
    });

    const cjRawText = await cjRes.text();
    let cjData;
    
    try {
       cjData = JSON.parse(cjRawText);
    } catch (e) {
       return NextResponse.json({ error: 'Supplier API is currently unreachable.' }, { status: 502 });
    }

    if (cjData.code === 200 && cjData.result === true && Array.isArray(cjData.data)) {
      
      if (cjData.data.length === 0) {
        return NextResponse.json({ error: 'CJ returned 0 shipping methods for this destination.' }, { status: 400 });
      }

      const shippingOptions = cjData.data
        .sort((a: any, b: any) => a.logisticPrice - b.logisticPrice)
        .map((option: any) => {
          const displayName = option.logisticName.replace(/CJ/gi, 'Teal')
          let tier = 'standard'
          let icon = '📦'
          const nameLower = displayName.toLowerCase()
          
          if (nameLower.includes('fast') || nameLower.includes('express') || nameLower.includes('dhl') || nameLower.includes('fedex')) {
            tier = 'express'; icon = '🚀';
          } else if (nameLower.includes('sensitive') || nameLower.includes('special')) {
            icon = '🛡️';
          }

          // ✅ NEW: Extract CJ taxes Fee
          const taxesFee = option.taxesFee || 0;

          return {
            id: option.logisticName, 
            displayName: displayName,
            tier: tier,
            icon: icon,
            price: option.logisticPrice, 
            taxesFee: taxesFee, // ✅ Return taxes fee back to checkout
            estimatedDays: `${option.logisticAging} days`,
            description: `Tracked delivery via ${displayName}`
          }
        })
        
        console.log('✅ Successfully mapped CJ Shipping Rates.');
        return NextResponse.json({ shippingOptions })

    } else {
      console.error('❌ CJ API REJECTED REQUEST:', cjData);
      return NextResponse.json({ error: `CJ Error: ${cjData.message}` }, { status: 400 })
    }

  } catch (error: any) {
    console.error("❌ [SHIPPING_API_ERROR] Caught Exception:", error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' }, 
      { status: 500 }
    )
  }
}
