
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Allow managers and super admins to view users
    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      where: {
        // Exclude the system deleted user account from the list
        username: {
          not: 'deleted_user_system'
        }
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isArchived: true,
        receivesHighPriorityEmails: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Allow managers and super admins to create users
    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { username, name, email, role, password } = await request.json()

    if (!username?.trim() || !name?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: 'Username, name, and password are required' },
        { status: 400 }
      )
    }

    // Managers cannot create Super Admin accounts
    if (session.user.role === UserRole.MANAGER && role === UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Managers cannot create Super Admin accounts' },
        { status: 403 }
      )
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }

    // Check if email already exists (if provided)
    if (email?.trim()) {
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      })

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        name: name.trim(),
        email: email?.trim() || null,
        password: hashedPassword,
        role: role as UserRole
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isArchived: true,
        createdAt: true
      }
    })

    return NextResponse.json(newUser)
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
