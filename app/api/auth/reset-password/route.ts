// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'                         import crypto from 'crypto'
                                                      export async function POST(req: NextRequest) {
  try {
    const { token, email, password } = await req.json()                                                     
    if (!token || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })                           }                                                 
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })            }
                                                          // Hash the incoming raw token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')                             
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier: email, token: hashedToken } },                                   })                                                
    if (!verificationToken) {                               return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }
                                                          if (verificationToken.expires < new Date()) {           // Clean up expired token                             await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: email, token: hashedToken } },
      })
      return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 })                                                       }                                                 
    // Update password                                    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.user.update({                              where: { email },                                     data: { password: hashedPassword },
    })

    // Delete used token
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: email, token: hashedToken } },                                   })
                                                          return NextResponse.json({ message: 'Password updated successfully' })
  } catch (error: any) {                                  console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }                                                   }
