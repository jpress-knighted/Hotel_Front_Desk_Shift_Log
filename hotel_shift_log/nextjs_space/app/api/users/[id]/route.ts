
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Allow managers and super admins to update users
    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = params.id
    const { username, name, email, role, password, isArchived, receivesHighPriorityEmails } = await request.json()

    if (!username?.trim() || !name?.trim()) {
      return NextResponse.json(
        { error: 'Username and name are required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Managers cannot edit Super Admin accounts
    if (session.user.role === UserRole.MANAGER && existingUser.role === UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Managers cannot edit Super Admin accounts' },
        { status: 403 }
      )
    }

    // Managers cannot promote users to Super Admin
    if (session.user.role === UserRole.MANAGER && role === UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Managers cannot promote users to Super Admin' },
        { status: 403 }
      )
    }

    // Prevent users from changing their own role
    if (userId === session.user.id && existingUser.role !== role) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 400 }
      )
    }

    // Prevent users from archiving themselves
    if (userId === session.user.id && isArchived === true) {
      return NextResponse.json(
        { error: 'You cannot archive your own account' },
        { status: 400 }
      )
    }

    // Check if username already exists (excluding current user)
    const usernameCheck = await prisma.user.findFirst({
      where: {
        username: username.trim(),
        id: { not: userId }
      }
    })

    if (usernameCheck) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }

    // Check if email already exists (excluding current user, if provided)
    if (email?.trim()) {
      const emailCheck = await prisma.user.findFirst({
        where: {
          email: email.trim(),
          id: { not: userId }
        }
      })

      if (emailCheck) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      username: username.trim(),
      name: name.trim(),
      email: email?.trim() || null,
      role: role as UserRole
    }

    // Handle archived status if provided
    if (typeof isArchived === 'boolean') {
      updateData.isArchived = isArchived
    }

    // Handle high priority email notifications if provided
    if (typeof receivesHighPriorityEmails === 'boolean') {
      updateData.receivesHighPriorityEmails = receivesHighPriorityEmails
    }

    // Hash new password if provided
    if (password?.trim()) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isArchived: true,
        receivesHighPriorityEmails: true,
        createdAt: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only super admin can delete users (managers can only archive)
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Only Super Admins can delete users' }, { status: 403 })
    }

    const userId = params.id

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Only archived users can be deleted
    if (!existingUser.isArchived) {
      return NextResponse.json(
        { error: 'Only archived users can be deleted. Please archive the user first.' },
        { status: 400 }
      )
    }

    // Prevent deleting yourself
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    // Delete user (posts and comments will be preserved with authorName)
    // The authorId will be set to null automatically due to ON DELETE SET NULL
    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
