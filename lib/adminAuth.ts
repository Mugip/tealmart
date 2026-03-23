// lib/adminAuth.ts - SECURE JWT AUTHENTICATION
import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION_USE_OPENSSL_RAND_BASE64_32'
)

export async function createAdminToken(email: string): Promise<string> {
  return new SignJWT({ role: 'admin', email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const verified = await jwtVerify(token, SECRET)
    return verified.payload.role === 'admin'
  } catch {
    return false
  }
}

export async function getAdminEmailFromToken(token: string): Promise<string | null> {
  try {
    const verified = await jwtVerify(token, SECRET)
    return (verified.payload.email as string) || null
  } catch {
    return null
  }
}
