// app/api/auth/signup/route.ts
// PRODUCTION-GRADE SECURE VERSION

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { sendWelcomeEmail } from '@/lib/email'

// Simple in-memory rate limiter (Vercel-safe fallback)
const rateLimitMap = new Map<string, { count: number; last: number }>()

function rateLimit(ip: string, limit = 5, windowMs = 60_000) {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry) {
    rateLimitMap.set(ip, { count: 1, last: now })
    return true
  }

  if (now - entry.last > windowMs) {
    rateLimitMap.set(ip, { count: 1, last: now })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}

// Strong password validation
function isStrongPassword(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^a-zA-Z0-9]/.test(password)
  )
}

export async function POST(req: NextRequest) {
  try {
    // Get IP (works on Vercel)
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    if (!rateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Try again later.' },
        { status: 429 }
      )
    }

    const body = await req.json()

    const {
      name,
      email,
      password,
      website // honeypot field
    } = body

    // Honeypot (bot protection)
    if (website) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }

    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()

    // Sanitize name
    const cleanName = name.trim().slice(0, 100)

    // Strong password enforcement
    if (!isStrongPassword(password)) {
      return NextResponse.json(
        {
          error:
            'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol',
        },
        { status: 400 }
      )
    }

    // Check existing user
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash password (cost 12 for better security)
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: normalizedEmail,
        password: hashedPassword,
      },
    })

    // Send welcome email (non-blocking)
    sendWelcomeEmail({
      to: normalizedEmail,
      name: cleanName,
    }).catch((error) => {
      console.error('Email send failed:', error)
    })

    // Safe response (no sensitive data)
    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)

    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
  }
