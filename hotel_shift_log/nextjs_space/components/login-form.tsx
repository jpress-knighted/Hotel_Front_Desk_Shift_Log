

'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogIn, AlertCircle } from 'lucide-react'

export default function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid username or password')
      } else {
        router.replace('/dashboard')
      }
    } catch (error) {
      setError('An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-300 bg-red-950/50 rounded-lg border border-red-900/50">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      
      <div>
        <Label htmlFor="username" className="text-gray-200 font-medium">Username</Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          placeholder="Enter your username"
          className="mt-1.5 bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder:text-gray-500 focus:ring-yellow-600 focus:border-yellow-600"
        />
      </div>

      <div>
        <Label htmlFor="password" className="text-gray-200 font-medium">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Enter your password"
          className="mt-1.5 bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder:text-gray-500 focus:ring-yellow-600 focus:border-yellow-600"
        />
      </div>

      <Button
        type="submit"
        className="w-full btn-champions mt-6"
        disabled={isLoading}
      >
        <LogIn className="h-4 w-4 mr-2" />
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  )
}

