// lib/adminAuth.ts - SECURE JWT AUTHENTICATION WITH RBAC
import { SignJWT, jwtVerify } from 'jose'

const getSecret = () => {
  if (!process.env.ADMIN_JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error("ADMIN_JWT_SECRET environment variable is missing!");
    }
    return new TextEncoder().encode('CHANGE_THIS_IN_PRODUCTION_USE_OPENSSL_RAND_BASE64_32');
  }
  return new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);
};

const SECRET = getSecret();

export interface AdminSession {
  email: string;
  role: 'admin' | 'staff';
  permissions: string[];
}

export async function createAdminToken(email: string, role: 'admin' | 'staff' = 'admin', permissions: string[] = ['all']): Promise<string> {
  return new SignJWT({ role, email, permissions })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const verified = await jwtVerify(token, SECRET)
    return verified.payload.role === 'admin' || verified.payload.role === 'staff'
  } catch {
    return false
  }
}

export async function getAdminSession(token: string): Promise<AdminSession | null> {
  try {
    const verified = await jwtVerify(token, SECRET)
    return {
      email: verified.payload.email as string,
      role: verified.payload.role as 'admin' | 'staff',
      permissions: (verified.payload.permissions as string[]) || [],
    }
  } catch {
    return null
  }
}

export async function getAdminEmailFromToken(token: string): Promise<string | null> {
  const session = await getAdminSession(token);
  return session?.email || null;
}
