// lib/adminAuth.ts - SECURE JWT AUTHENTICATION
import { SignJWT, jwtVerify } from 'jose'

const getSecret = () => {
  if (!process.env.ADMIN_JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error("ADMIN_JWT_SECRET environment variable is missing! Please configure this securely in Vercel.");
    }
    return new TextEncoder().encode('CHANGE_THIS_IN_PRODUCTION_USE_OPENSSL_RAND_BASE64_32');
  }
  return new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);
};

const SECRET = getSecret();

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
