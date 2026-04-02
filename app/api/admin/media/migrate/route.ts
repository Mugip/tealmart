// app/api/admin/media/migrate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { getAdminSession } from '@/lib/adminAuth'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // 1. Verify Admin Auth
  const token = cookies().get('admin-auth')?.value
  const session = token ? await getAdminSession(token) : null
  
  if (!session || !session.permissions.includes('all')) {
    return NextResponse.json({ error: 'Unauthorized. Super Admin only.' }, { status: 401 })
  }

  // 2. Check for R2 Credentials
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
    return NextResponse.json({ 
      error: 'Missing Cloudflare R2 Credentials in environment variables. Please configure your .env file first.' 
    }, { status: 400 })
  }

  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  })

  try {
    // 3. Find 10 products that still use external supplier images
    const productsToMigrate = await prisma.$queryRaw<{id: string, images: string[], title: string}[]>`
      SELECT id, title, images FROM "Product" 
      WHERE array_to_string(images, ',') LIKE '%cjdrop%' 
         OR array_to_string(images, ',') LIKE '%aliexpress%'
      LIMIT 10
    `

    if (productsToMigrate.length === 0) {
      return NextResponse.json({ message: "All product images are fully migrated to your CDN! 🎉" })
    }

    let imagesMigrated = 0
    let productsUpdated = 0
    const logs: string[] = []

    // 4. Process the batch
    for (const product of productsToMigrate) {
      const newImages: string[] = []
      let changed = false

      for (let i = 0; i < product.images.length; i++) {
        const oldUrl = product.images[i]
        
        // Skip already migrated images
        if (!oldUrl.includes('cjdrop') && !oldUrl.includes('aliexpress')) {
          newImages.push(oldUrl)
          continue
        }

        try {
          // Download from supplier pretending to be a browser
          const res = await fetch(oldUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
          })
          
          if (!res.ok) throw new Error('Download failed')

          const buffer = Buffer.from(await res.arrayBuffer())
          const contentType = res.headers.get('content-type') || 'image/jpeg'
          const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
          
          // Generate clean path: products/cuid/img_0.jpg
          const newKey = `products/${product.id}/img_${i}_${Date.now()}.${ext}`

          // Upload to R2
          await r2.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: newKey,
            Body: buffer,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000, immutable'
          }))

          const newR2Url = `${process.env.R2_PUBLIC_URL}/${newKey}`
          newImages.push(newR2Url)
          imagesMigrated++
          changed = true
          
        } catch (err) {
          console.error(`❌ Failed to migrate image: ${oldUrl}`)
          newImages.push(oldUrl) // Keep old URL if it fails so product doesn't break
          logs.push(`Failed to fetch image for: ${product.title.substring(0, 30)}...`)
        }
      }

      // Save the new R2 URLs to the database
      if (changed) {
        await prisma.product.update({
          where: { id: product.id },
          data: { images: newImages }
        })
        productsUpdated++
        logs.push(`Migrated ${product.title.substring(0, 30)}...`)
      }
    }

    // Check remaining count
    const remainingResult = await prisma.$queryRaw<{count: bigint}[]>`
      SELECT COUNT(*) as count FROM "Product" 
      WHERE array_to_string(images, ',') LIKE '%cjdrop%' 
         OR array_to_string(images, ',') LIKE '%aliexpress%'
    `
    const remaining = Number(remainingResult[0]?.count || 0)

    return NextResponse.json({
      message: `Successfully migrated ${imagesMigrated} images across ${productsUpdated} products!`,
      stats: {
        productsUpdated,
        imagesMigrated,
        remainingInDatabase: remaining
      },
      logs
    })

  } catch (error: any) {
    console.error('[MIGRATE_IMAGES_ERROR]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
