

'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut, Users, Plus } from 'lucide-react'
import { UserRole } from '@prisma/client'
import Link from 'next/link'
import Image from 'next/image'

interface DashboardHeaderProps {
  user: {
    id: string
    username: string
    role: UserRole
    name?: string | null
  }
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'bg-gradient-to-r from-red-900/80 to-red-800/80 text-red-200 border border-red-700/50 shadow-lg shadow-red-900/20'
      case UserRole.MANAGER:
        return 'bg-gradient-to-r from-yellow-900/80 to-amber-800/80 text-yellow-200 border border-yellow-700/50 shadow-lg shadow-yellow-900/20'
      case UserRole.EMPLOYEE:
        return 'bg-gradient-to-r from-gray-700/80 to-gray-600/80 text-gray-200 border border-gray-500/50 shadow-lg shadow-gray-900/20'
      default:
        return 'bg-gray-800/80 text-gray-200 border border-gray-700/50'
    }
  }

  const formatRole = (role: UserRole) => {
    if (role === UserRole.EMPLOYEE) {
      return 'Staff'
    }
    return role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md border-b border-gray-700/30"
      style={{
        background: 'linear-gradient(135deg, rgba(60, 60, 65, 0.95), rgba(70, 70, 75, 0.95))',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(234, 179, 8, 0.1)'
      }}>
      <div className="container mx-auto px-2 sm:px-4 max-w-6xl">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left side: Logo, Username, Star, Role Badge, Sign Out */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Larger Logo without box */}
            <Link href="/dashboard" className="relative h-12 w-48 hidden sm:block flex-shrink-0">
              <Image
                src="https://cdn.abacus.ai/images/abf2f449-00c8-4dfb-9b2c-47c68f7954b8.png"
                alt="Champion's Club"
                fill
                className="object-contain drop-shadow-lg"
              />
            </Link>
            
            {/* Mobile title */}
            <Link href="/dashboard" className="text-base font-bold sm:hidden"
              style={{
                background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
              Shift Log
            </Link>
            
            {/* Username without "Welcome" */}
            <span className="hidden lg:block text-sm font-semibold"
              style={{
                background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
              {user.name}
            </span>

            {/* Gold diamond star */}
            <div className="hidden lg:block w-1.5 h-1.5 rotate-45 bg-gradient-to-br from-yellow-500 to-yellow-700 shadow-lg shadow-yellow-600/50 flex-shrink-0"></div>
            
            {/* Role badge with no rounded corners */}
            <span className={`hidden lg:block px-3 py-1 text-xs font-semibold whitespace-nowrap ${getRoleBadgeColor(user.role)} flex-shrink-0`}
              style={{ borderRadius: '0' }}>
              {formatRole(user.role)}
            </span>

            {/* Sign Out button - Desktop */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="hidden lg:flex btn-champions flex-shrink-0 h-auto"
              style={{ padding: '0.25rem 0.75rem' }}
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Sign Out
            </Button>
          </div>

          {/* Right side: Manage Users (if super admin or manager), New Report */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Manage Users - Desktop with text */}
            {(user.role === UserRole.SUPER_ADMIN || user.role === UserRole.MANAGER) && (
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className="hidden md:flex btn-champions h-auto"
                style={{ padding: '0.25rem 0.75rem' }}
              >
                <Link href="/users">
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  Manage Users
                </Link>
              </Button>
            )}

            {/* Manage Users - Mobile icon only */}
            {(user.role === UserRole.SUPER_ADMIN || user.role === UserRole.MANAGER) && (
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className="md:hidden btn-champions h-auto"
                style={{ padding: '0.25rem 0.75rem' }}
              >
                <Link href="/users">
                  <Users className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}

            {/* New Report - Desktop with text */}
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="hidden md:flex btn-champions h-auto"
              style={{ padding: '0.25rem 0.75rem' }}
            >
              <Link href="/add-report">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                New Report
              </Link>
            </Button>

            {/* New Report - Mobile icon only */}
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="md:hidden btn-champions h-auto"
              style={{ padding: '0.25rem 0.75rem' }}
            >
              <Link href="/add-report">
                <Plus className="h-3.5 w-3.5" />
              </Link>
            </Button>

            {/* Sign Out button - Mobile/Tablet (for screens smaller than lg) */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="lg:hidden btn-champions h-auto"
              style={{ padding: '0.25rem 0.75rem' }}
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

