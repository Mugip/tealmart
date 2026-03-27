// app/api/admin/cj/register-webhook/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/adminAuth'
import { getCJToken } from '@/lib/cjToken'

const CJ_API = 'https://developers.cjdropshipping.com/api2.0/v1/webhook/set'

async function requireAdmin() {
  const token = cookies().get('admin-auth')?.value
  return !!token && (await verifyAdminToken(token))
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl || baseUrl.includes('tealmart.vercel.app')) {
    return NextResponse.json({ 
      error: 'Please set NEXT_PUBLIC_APP_URL in your environment variables to your actual domain before registering the webhook.' 
    }, { status: 400 });
  }
  
  const webhookUrl = `${baseUrl}/api/webhooks/cj`

  let cjToken: string
  try {
    cjToken = await getCJToken()
  } catch (err: any) {
    return NextResponse.json({ error: `Failed to get CJ token: ${err.message}` }, { status: 500 })
  }

  const body = {
    product: {
      type: 'ENABLE',
      callbackUrls: [webhookUrl],
    },
    stock: {
      type: 'ENABLE',
      callbackUrls: [webhookUrl],
    },
    order: {
      type: 'ENABLE',
      callbackUrls: [webhookUrl],
    },
    logistics: {
      type: 'ENABLE',
      callbackUrls: [webhookUrl],
    },
  }

  console.log(`[register-webhook] Registering ${webhookUrl} with CJ...`)

  const res = await fetch(CJ_API, {
    method: 'POST',
    headers: {
      'CJ-Access-Token': cjToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (data.success || data.code === 200) {
    console.log('[register-webhook] CJ webhook registered successfully')
    return NextResponse.json({
      ok: true,
      webhookUrl,
      cjResponse: data,
      message: `Webhook registered at ${webhookUrl}. CJ will now POST order, logistics, stock, and product events to this URL.`,
    })
  } else {
    console.error('[register-webhook] CJ registration failed:', data)
    return NextResponse.json({
      ok: false,
      webhookUrl,
      cjResponse: data,
      error: data.message || 'CJ registration failed',
    }, { status: 400 })
  }
}

// GET — check current webhook registration status
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let cjToken: string
  try {
    cjToken = await getCJToken()
  } catch (err: any) {
    return NextResponse.json({ error: `Failed to get CJ token: ${err.message}` }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl || baseUrl.includes('tealmart.vercel.app')) {
    return NextResponse.json({ 
      error: 'Please set NEXT_PUBLIC_APP_URL in your environment variables to your actual domain before registering the webhook.' 
    }, { status: 400 });
  }
  
  const webhookUrl = `${baseUrl}/api/webhooks/cj`

  return NextResponse.json({
    webhookUrl,
    tokenValid: !!cjToken,
    instructions: 'POST to this endpoint to register the webhook with CJ.',
  })
        }
