// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      // Generate a secure token
      const rawToken = crypto.randomBytes(32).toString('hex')
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')
      const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      // Store token (using VerificationToken table from NextAuth schema)
      await prisma.verificationToken.upsert({
        where: { identifier_token: { identifier: email, token: hashedToken } },
        update: { expires, token: hashedToken },
        create: { identifier: email, token: hashedToken, expires },
      })

      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`

      // Send email if Resend is configured
      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: process.env.SMTP_FROM || 'noreply@tealmart.com',
          to: email,
          subject: 'Reset your TealMart password',
          html: `<h2>Reset Your Password</h2>
            <p>Hi ${user.name || 'there'},</p>
            <p>Someone requested a password reset for your TealMart account.</p>
            <p>Click the link below to reset your password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#14b8a6;color:white;text-decoration:none;border-radius:8px;margin:16px 0;">
              Reset Password
            </a>
            <p>If you didn't request this, you can safely ignore this email.</p>`,
        })
      } else {
        // Fallback: log the reset URL for development
        console.log(`🔗 Password reset URL for ${email}: ${resetUrl}`)
      }
    }

    // Always return success (don't reveal if email exists)
    return NextResponse.json({
      message: 'If an account exists with this email, a reset link has been sent.',
    })
  } catch (error: any) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
          }
