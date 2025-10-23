
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { UserRole } from '@prisma/client'
import UserManagement from '@/components/user-management'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function UsersPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  // Allow both managers and super admins to access
  if (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.MANAGER) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4 btn-champions">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-100">User Management</h1>
          <p className="text-gray-400 mt-1">
            Manage hotel staff accounts and their roles
          </p>
        </div>
        
        <UserManagement userRole={session.user.role} currentUserId={session.user.id} />
      </div>
    </div>
  )
}
