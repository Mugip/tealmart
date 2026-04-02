// scripts/migrate-images-to-r2.ts
import { PrismaClient } from '@prisma/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const prisma = new PrismaClient()

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

async function migrateImages() {
  console.log('🚀 Starting Image Migration to Cloudflare R2...')

  const products = await prisma.product.findMany({
    where: {
      images: { hasSome: ['cjdrop'] } // Find products that still use CJ URLs
    }
  })

  console.log(`Found ${products.length} products to migrate.`)

  for (const product of products) {
    const newImages: string[] = []

    for (let i = 0; i < product.images.length; i++) {
      const oldUrl = product.images[i]
      
      if (!oldUrl.includes('cjdrop')) {
        newImages.push(oldUrl)
        continue
      }

      try {
        console.log(`Downloading: ${oldUrl}`)
        const res = await fetch(oldUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        })
        
        const buffer = Buffer.from(await res.arrayBuffer())
        const contentType = res.headers.get('content-type') || 'image/jpeg'
        const ext = contentType.split('/')[1] || 'jpg'
        const newKey = `products/${product.id}/img_${i}.${ext}`

        console.log(`Uploading to R2: ${newKey}`)
        await r2.send(new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: newKey,
          Body: buffer,
          ContentType: contentType,
        }))

        const newR2Url = `${process.env.R2_PUBLIC_URL}/${newKey}`
        newImages.push(newR2Url)
        
      } catch (err) {
        console.error(`❌ Failed to migrate image: ${oldUrl}`)
        newImages.push(oldUrl) // keep old if it fails
      }
    }

    // Save the new R2 URLs to the database
    await prisma.product.update({
      where: { id: product.id },
      data: { images: newImages }
    })
    console.log(`✅ Updated Product: ${product.title}\n`)
  }

  console.log('🎉 Migration Complete!')
}

migrateImages()
