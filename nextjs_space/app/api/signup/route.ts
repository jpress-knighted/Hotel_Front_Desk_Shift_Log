
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password, name, role } = await request.json()

    if (!username?.trim() || !password?.trim() || !name?.trim()) {
      return NextResponse.json(
        { error: 'Username, password, and name are required' },
        { status: 400 }
      )
    }

    // Check if any users exist in the system
    const userCount = await prisma.user.count()
    
    // If users exist, require authentication
    if (userCount > 0) {
      const session = await getServerSession(authOptions)
      
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Only SUPER_ADMIN can create new users after initial setup
      if (session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Only super admins can create new users' },
          { status: 403 }
        )
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Map role string to enum
    let userRole: UserRole = UserRole.EMPLOYEE
    if (role === 'super_admin' || role === 'SUPER_ADMIN') userRole = UserRole.SUPER_ADMIN
    else if (role === 'manager' || role === 'MANAGER') userRole = UserRole.MANAGER
    else if (role === 'employee' || role === 'EMPLOYEE') userRole = UserRole.EMPLOYEE

    // Create user
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        password: hashedPassword,
        name: name.trim(),
        role: userRole
      }
    })

    return NextResponse.json({ 
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
