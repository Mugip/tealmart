// app/api/cron/migrate-media/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export const maxDuration = 300; 
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 1. Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // 2. Check for R2 Credentials
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
    return NextResponse.json({ error: 'R2 Credentials Missing' }, { status: 400 })
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
    // 3. Find exactly 15 products with external images to process
    // 15 is the "safe zone" for Vercel Hobby tier timeouts.
    const productsToMigrate = await prisma.$queryRaw<{id: string, images: string[], variants: any}[]>`
      SELECT id, images, variants FROM "Product" 
      WHERE array_to_string(images, ',') LIKE '%cjdrop%' 
         OR array_to_string(images, ',') LIKE '%aliexpress%'
         OR variants::text LIKE '%cjdrop%'
      LIMIT 15
    `

    if (productsToMigrate.length === 0) {
      return NextResponse.json({ message: "All images are fully migrated." })
    }

    let imagesMigrated = 0
    let productsUpdated = 0

    // Helper to upload a single image to R2
    const uploadToR2 = async (url: string, keyPrefix: string): Promise<string> => {
      if (!url.includes('cjdrop') && !url.includes('aliexpress')) return url;
      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) return url;
        
        const buffer = Buffer.from(await res.arrayBuffer());
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
        const key = `products/${keyPrefix}_${Date.now()}.${ext}`;

        await r2.send(new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          CacheControl: 'public, max-age=31536000, immutable'
        }));
        
        imagesMigrated++;
        return `${process.env.R2_PUBLIC_URL}/${key}`;
      } catch (err) {
        return url;
      }
    };

    // 4. Process the batch
    for (const product of productsToMigrate) {
      let changed = false;

      // Migrate Main Images concurrently
      const newImages = await Promise.all(
        product.images.map((url, i) => {
          if (url.includes('cjdrop') || url.includes('aliexpress')) {
            changed = true;
            return uploadToR2(url, `${product.id}_main_${i}`);
          }
          return url;
        })
      );

      // Migrate Variant Images
      let newVariants = product.variants;
      if (newVariants && typeof newVariants === 'object' && newVariants.items) {
        newVariants.items = await Promise.all(
          newVariants.items.map(async (variant: any) => {
            if (variant.image && (variant.image.includes('cjdrop') || variant.image.includes('aliexpress'))) {
              changed = true;
              variant.image = await uploadToR2(variant.image, `${product.id}_var_${variant.id}`);
            }
            return variant;
          })
        );
      }

      if (changed) {
        await prisma.product.update({
          where: { id: product.id },
          data: { 
            images: newImages,
            variants: newVariants 
          }
        });
        productsUpdated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cron swept ${imagesMigrated} images across ${productsUpdated} products.`,
    })

  } catch (error: any) {
    console.error('[CRON_MIGRATE_ERROR]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
