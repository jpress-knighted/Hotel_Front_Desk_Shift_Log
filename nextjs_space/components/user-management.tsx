
'use client'

import { useState, useEffect } from 'react'
import { UserRole } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Plus, Edit2, Save, X, Users, Trash2, Archive, ArchiveRestore, Bell, BellOff } from 'lucide-react'

interface User {
  id: string
  username: string
  name: string
  role: UserRole
  email: string | null
  isArchived: boolean
  receivesHighPriorityEmails: boolean
  createdAt: string
}

interface EditingUser {
  id?: string
  username: string
  name: string
  role: UserRole
  email: string
  password: string
}

interface UserManagementProps {
  userRole: UserRole
  currentUserId: string
}

export default function UserManagement({ userRole, currentUserId }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [editForm, setEditForm] = useState<EditingUser>({
    username: '',
    name: '',
    role: UserRole.EMPLOYEE,
    email: '',
    password: ''
  })
  const [error, setError] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (user: User) => {
    setEditing(user.id)
    setEditForm({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email || '',
      password: '' // Don't load existing password
    })
    setError('')
  }

  const startAdd = () => {
    setAdding(true)
    setEditForm({
      username: '',
      name: '',
      role: UserRole.EMPLOYEE,
      email: '',
      password: ''
    })
    setError('')
  }

  const cancelEdit = () => {
    setEditing(null)
    setAdding(false)
    setEditForm({
      username: '',
      name: '',
      role: UserRole.EMPLOYEE,
      email: '',
      password: ''
    })
    setError('')
  }

  const saveUser = async () => {
    if (!editForm.username.trim() || !editForm.name.trim()) {
      setError('Username and name are required')
      return
    }

    if (adding && !editForm.password.trim()) {
      setError('Password is required for new users')
      return
    }

    try {
      const url = adding ? '/api/users' : `/api/users/${editForm.id}`
      const method = adding ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        await loadUsers()
        cancelEdit()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save user')
      }
    } catch (error) {
      console.error('Error saving user:', error)
      setError('An error occurred while saving the user')
    }
  }

  const archiveUser = async (user: User) => {
    const action = user.isArchived ? 'unarchive' : 'archive'
    if (!window.confirm(`Are you sure you want to ${action} the user "${user.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: user.username,
          name: user.name,
          email: user.email || '',
          role: user.role,
          isArchived: !user.isArchived 
        })
      })

      if (response.ok) {
        await loadUsers()
      } else {
        const data = await response.json()
        setError(data.error || `Failed to ${action} user`)
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error)
      setError(`An error occurred while ${action}ing the user`)
    }
  }

  const deleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the user "${userName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadUsers()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      setError('An error occurred while deleting the user')
    }
  }

  const toggleHighPriorityEmails = async (user: User) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: user.username,
          name: user.name,
          email: user.email || '',
          role: user.role,
          receivesHighPriorityEmails: !user.receivesHighPriorityEmails 
        })
      })

      if (response.ok) {
        await loadUsers()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update notification settings')
      }
    } catch (error) {
      console.error('Error updating notification settings:', error)
      setError('An error occurred while updating notification settings')
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'bg-red-100 text-red-800'
      case UserRole.MANAGER:
        return 'bg-blue-100 text-blue-800'
      case UserRole.EMPLOYEE:
        return 'bg-gray-300 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatRole = (role: UserRole) => {
    return role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  // Separate active and archived users
  const activeUsers = users.filter(u => !u.isArchived)
  const archivedUsers = users.filter(u => u.isArchived)
  const isSuperAdmin = userRole === UserRole.SUPER_ADMIN
  const isManager = userRole === UserRole.MANAGER

  return (
    <div className="space-y-6">
      {/* Add User Button */}
      <div className="flex justify-end">
        <Button onClick={startAdd} disabled={adding || editing !== null} className="btn-champions">
          <Plus className="h-4 w-4 mr-2" />
          Add New User
        </Button>
      </div>

      {/* Add User Form */}
      {adding && (
        <Card>
          <CardHeader>
            <CardTitle>Add New User</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-username">Username *</Label>
                <Input
                  id="add-username"
                  value={editForm.username}
                  onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  placeholder="Enter username"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="add-name">Full Name *</Label>
                <Input
                  id="add-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  placeholder="Enter full name"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="add-email">Email</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  placeholder="Enter email (optional)"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="add-role">Role</Label>
                <Select value={editForm.role} onValueChange={(value: UserRole) => setEditForm({...editForm, role: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.EMPLOYEE}>Employee</SelectItem>
                    <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                    {isSuperAdmin && <SelectItem value={UserRole.SUPER_ADMIN}>Super Admin</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="add-password">Password *</Label>
                <Input
                  id="add-password"
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                  placeholder="Enter password"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={saveUser} className="btn-champions">
                <Save className="h-4 w-4 mr-2" />
                Add User
              </Button>
              <Button variant="outline" onClick={cancelEdit} className="btn-champions">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Users List */}
      <div className="space-y-4">
        {activeUsers.length === 0 && archivedUsers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {activeUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                {editing === user.id ? (
                  // Edit Form
                  <div>
                    {error && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded mb-4">
                        {error}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-username">Username *</Label>
                        <Input
                          id="edit-username"
                          value={editForm.username}
                          onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                          className="mt-1"
                          disabled={isManager && user.role === UserRole.SUPER_ADMIN}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-name">Full Name *</Label>
                        <Input
                          id="edit-name"
                          value={editForm.name}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          className="mt-1"
                          disabled={isManager && user.role === UserRole.SUPER_ADMIN}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-email">Email</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          className="mt-1"
                          disabled={isManager && user.role === UserRole.SUPER_ADMIN}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-role">Role</Label>
                        <Select 
                          value={editForm.role} 
                          onValueChange={(value: UserRole) => setEditForm({...editForm, role: value})}
                          disabled={(isManager && user.role === UserRole.SUPER_ADMIN) || user.id === currentUserId}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UserRole.EMPLOYEE}>Employee</SelectItem>
                            <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                            {isSuperAdmin && <SelectItem value={UserRole.SUPER_ADMIN}>Super Admin</SelectItem>}
                          </SelectContent>
                        </Select>
                        {user.id === currentUserId && (
                          <p className="text-xs text-gray-400 mt-1">You cannot change your own role</p>
                        )}
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label htmlFor="edit-password">New Password (leave blank to keep current)</Label>
                        <Input
                          id="edit-password"
                          type="password"
                          value={editForm.password}
                          onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                          placeholder="Enter new password or leave blank"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-4">
                      <div className="flex gap-2">
                        <Button 
                          onClick={saveUser} 
                          className="btn-champions"
                          disabled={isManager && user.role === UserRole.SUPER_ADMIN}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={cancelEdit} className="btn-champions">
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                      {user.id !== currentUserId && (
                        <div className="flex gap-2">
                          {isManager && user.role !== UserRole.SUPER_ADMIN && (
                            <Button 
                              variant="outline"
                              onClick={() => {
                                archiveUser(user)
                                cancelEdit()
                              }}
                              className="btn-champions"
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Archive User
                            </Button>
                          )}
                          {isSuperAdmin && !user.isArchived && (
                            <Button 
                              variant="outline"
                              onClick={() => {
                                archiveUser(user)
                                cancelEdit()
                              }}
                              className="btn-champions"
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Archive User
                            </Button>
                          )}
                          {isSuperAdmin && user.isArchived && (
                            <Button 
                              variant="destructive" 
                              onClick={() => {
                                if (user.id) {
                                  deleteUser(user.id, user.name)
                                  cancelEdit()
                                }
                              }}
                              className="btn-champions"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg text-gray-100">{user.name}</h3>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {formatRole(user.role)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-400">
                        <span className="font-medium">Username:</span> {user.username}
                      </div>
                      {user.email && (
                        <div className="text-sm text-gray-400">
                          <span className="font-medium">Email:</span> {user.email}
                        </div>
                      )}
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Created:</span> {formatDate(user.createdAt)}
                      </div>
                      
                      {/* High Priority Email Notifications Toggle */}
                      <div className="flex items-center gap-3 pt-2 border-t border-gray-700/50 mt-3">
                        <div className="flex items-center gap-2">
                          {user.receivesHighPriorityEmails ? (
                            <Bell className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <BellOff className="h-4 w-4 text-gray-500" />
                          )}
                          <Label htmlFor={`email-notify-${user.id}`} className="text-sm text-gray-300 cursor-pointer">
                            Receives High Priority Email Alerts
                          </Label>
                        </div>
                        <Switch
                          id={`email-notify-${user.id}`}
                          checked={user.receivesHighPriorityEmails}
                          onCheckedChange={() => toggleHighPriorityEmails(user)}
                          disabled={adding || editing !== null}
                        />
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(user)}
                      disabled={adding || editing !== null || (isManager && user.role === UserRole.SUPER_ADMIN)}
                      className="btn-champions"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      {isManager && user.role === UserRole.SUPER_ADMIN ? 'Cannot Edit' : 'Edit'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Archived Users Section */}
          {archivedUsers.length > 0 && (
            <>
              <div className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 h-px bg-gray-700"></div>
                  <h3 className="text-lg font-semibold text-gray-400">Archived</h3>
                  <div className="flex-1 h-px bg-gray-700"></div>
                </div>
              </div>

              {archivedUsers.map((user) => (
                <Card key={user.id} className="opacity-60">
                  <CardContent className="p-4">
                    {editing === user.id ? (
                      // Edit Form for Archived Users (same as above)
                      <div>
                        {error && (
                          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded mb-4">
                            {error}
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit-username">Username *</Label>
                            <Input
                              id="edit-username"
                              value={editForm.username}
                              onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                              className="mt-1"
                              disabled={isManager && user.role === UserRole.SUPER_ADMIN}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="edit-name">Full Name *</Label>
                            <Input
                              id="edit-name"
                              value={editForm.name}
                              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                              className="mt-1"
                              disabled={isManager && user.role === UserRole.SUPER_ADMIN}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                              id="edit-email"
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                              className="mt-1"
                              disabled={isManager && user.role === UserRole.SUPER_ADMIN}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="edit-role">Role</Label>
                            <Select 
                              value={editForm.role} 
                              onValueChange={(value: UserRole) => setEditForm({...editForm, role: value})}
                              disabled={(isManager && user.role === UserRole.SUPER_ADMIN) || user.id === currentUserId}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={UserRole.EMPLOYEE}>Employee</SelectItem>
                                <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                                {isSuperAdmin && <SelectItem value={UserRole.SUPER_ADMIN}>Super Admin</SelectItem>}
                              </SelectContent>
                            </Select>
                            {user.id === currentUserId && (
                              <p className="text-xs text-gray-400 mt-1">You cannot change your own role</p>
                            )}
                          </div>
                          
                          <div className="md:col-span-2">
                            <Label htmlFor="edit-password">New Password (leave blank to keep current)</Label>
                            <Input
                              id="edit-password"
                              type="password"
                              value={editForm.password}
                              onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                              placeholder="Enter new password or leave blank"
                              className="mt-1"
                              disabled={isManager && user.role === UserRole.SUPER_ADMIN}
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-between mt-4">
                          <div className="flex gap-2">
                            <Button 
                              onClick={saveUser} 
                              className="btn-champions"
                              disabled={isManager && user.role === UserRole.SUPER_ADMIN}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </Button>
                            <Button variant="outline" onClick={cancelEdit} className="btn-champions">
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                          {user.id !== currentUserId && (
                            <div className="flex gap-2">
                              <Button 
                                variant="outline"
                                onClick={() => {
                                  archiveUser(user)
                                  cancelEdit()
                                }}
                                className="btn-champions"
                              >
                                <ArchiveRestore className="h-4 w-4 mr-2" />
                                Unarchive User
                              </Button>
                              {isSuperAdmin && (
                                <Button 
                                  variant="destructive" 
                                  onClick={() => {
                                    if (user.id) {
                                      deleteUser(user.id, user.name)
                                      cancelEdit()
                                    }
                                  }}
                                  className="btn-champions"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete User
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      // View Mode for Archived Users
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg text-gray-100">{user.name}</h3>
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {formatRole(user.role)}
                            </Badge>
                            <Badge variant="outline" className="text-gray-400 border-gray-600">
                              Archived
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-400">
                            <span className="font-medium">Username:</span> {user.username}
                          </div>
                          {user.email && (
                            <div className="text-sm text-gray-400">
                              <span className="font-medium">Email:</span> {user.email}
                            </div>
                          )}
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">Created:</span> {formatDate(user.createdAt)}
                          </div>
                          
                          {/* High Priority Email Notifications Toggle */}
                          <div className="flex items-center gap-3 pt-2 border-t border-gray-700/50 mt-3">
                            <div className="flex items-center gap-2">
                              {user.receivesHighPriorityEmails ? (
                                <Bell className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <BellOff className="h-4 w-4 text-gray-500" />
                              )}
                              <Label htmlFor={`email-notify-archived-${user.id}`} className="text-sm text-gray-300 cursor-pointer">
                                Receives High Priority Email Alerts
                              </Label>
                            </div>
                            <Switch
                              id={`email-notify-archived-${user.id}`}
                              checked={user.receivesHighPriorityEmails}
                              onCheckedChange={() => toggleHighPriorityEmails(user)}
                              disabled={adding || editing !== null}
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => archiveUser(user)}
                            disabled={adding || editing !== null || user.id === currentUserId}
                            className="btn-champions"
                          >
                            <ArchiveRestore className="h-4 w-4 mr-2" />
                            {user.id === currentUserId ? 'Cannot Modify Self' : 'Unarchive'}
                          </Button>
                          {isSuperAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEdit(user)}
                              disabled={adding || editing !== null}
                              className="btn-champions"
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </>
          )}
          </>
        )}
      </div>
    </div>
  )
}
