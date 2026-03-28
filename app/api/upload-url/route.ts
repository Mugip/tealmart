// app/api/upload-url/route.ts
import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function POST(req: Request) {
  const { fileType } = await req.json()

  const key = `reviews/${Date.now()}.jpg`

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: fileType,
  })

  const url = await getSignedUrl(client, command, { expiresIn: 60 })

  return NextResponse.json({
    uploadUrl: url,
    fileUrl: `${process.env.R2_PUBLIC_URL}/${key}`,
  })
}
