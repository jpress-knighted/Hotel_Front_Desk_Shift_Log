

'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { UserRole, Priority } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AlertTriangle, Plus, X, Upload, Send, LogOut, Info } from 'lucide-react'

// Allowed file types
const ALLOWED_FILE_TYPES = [
  // Images
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  // Text
  'text/plain', 'text/csv',
  // Archives
  'application/zip',
]

const ALLOWED_FILE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
  '.pdf',
  '.doc', '.docx',
  '.xls', '.xlsx',
  '.ppt', '.pptx',
  '.txt', '.csv',
  '.zip'
]

interface User {
  id: string
  username: string
  role: UserRole
  name?: string | null
}

interface AddReportFormProps {
  user: User
}

export default function AddReportForm({ user }: AddReportFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(false)
  const [priority, setPriority] = useState<Priority>(Priority.NONE)
  const [bodyText, setBodyText] = useState('')
  const [notedRooms, setNotedRooms] = useState<string[]>([''])
  const [stayoverRooms, setStayoverRooms] = useState<string[]>([''])
  const [arrivals, setArrivals] = useState('')
  const [departures, setDepartures] = useState('')
  const [occupancyPercentage, setOccupancyPercentage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [dailyPostCount, setDailyPostCount] = useState(0)

  // Check daily post limit on component mount
  useEffect(() => {
    checkDailyPostLimit()
  }, [])

  const checkDailyPostLimit = async () => {
    try {
      const response = await fetch('/api/daily-post-count')
      if (response.ok) {
        const data = await response.json()
        setDailyPostCount(data.count)
      }
    } catch (error) {
      console.error('Error checking daily post limit:', error)
    }
  }

  const addRoomField = (type: 'noted' | 'stayover') => {
    if (type === 'noted' && notedRooms.length < 50) {
      setNotedRooms([...notedRooms, ''])
    } else if (type === 'stayover' && stayoverRooms.length < 50) {
      setStayoverRooms([...stayoverRooms, ''])
    }
  }

  const removeRoomField = (type: 'noted' | 'stayover', index: number) => {
    if (type === 'noted') {
      setNotedRooms(notedRooms.filter((_, i) => i !== index))
    } else {
      setStayoverRooms(stayoverRooms.filter((_, i) => i !== index))
    }
  }

  const updateRoom = (type: 'noted' | 'stayover', index: number, value: string) => {
    if (type === 'noted') {
      const updated = [...notedRooms]
      updated[index] = value
      setNotedRooms(updated)
    } else {
      const updated = [...stayoverRooms]
      updated[index] = value
      setStayoverRooms(updated)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    
    if (selectedFiles.length + files.length > 3) {
      setError('Maximum 3 files allowed')
      return
    }

    // Check file types
    const invalidFiles = selectedFiles.filter(file => {
      const isValidType = ALLOWED_FILE_TYPES.includes(file.type)
      const extension = '.' + file.name.split('.').pop()?.toLowerCase()
      const isValidExtension = ALLOWED_FILE_EXTENSIONS.includes(extension)
      return !isValidType && !isValidExtension
    })

    if (invalidFiles.length > 0) {
      setError(`Invalid file type(s): ${invalidFiles.map(f => f.name).join(', ')}. Please upload only images, PDFs, documents, or spreadsheets.`)
      return
    }

    const totalSize = [...files, ...selectedFiles].reduce((sum, file) => sum + file.size, 0)
    if (totalSize > 30 * 1024 * 1024) { // 30MB
      setError('Total file size cannot exceed 30MB')
      return
    }

    setFiles([...files, ...selectedFiles])
    setError('')
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const isFormValid = () => {
    return (
      priority !== Priority.NONE ||
      bodyText.trim() ||
      notedRooms.some(room => room.trim()) ||
      stayoverRooms.some(room => room.trim()) ||
      arrivals.trim() ||
      departures.trim() ||
      occupancyPercentage.trim() ||
      files.length > 0
    )
  }

  const handleSubmit = async (shouldLogout: boolean) => {
    if (dailyPostCount >= 25) {
      setError('Daily limit of 25 reports has been reached. Please try again tomorrow.')
      return
    }

    if (!isFormValid()) {
      setError('At least one field must be filled or changed from default')
      return
    }

    if (priority === Priority.HIGH) {
      const confirmed = window.confirm(
        'This is a HIGH priority report. Please ensure you have contacted your manager immediately before submitting this report. Do you want to continue?'
      )
      if (!confirmed) return
    }

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      
      formData.append('priority', priority)
      formData.append('bodyText', bodyText.trim())
      formData.append('notedRooms', JSON.stringify(
        notedRooms.filter(room => room.trim()).map(room => parseInt(room))
      ))
      formData.append('stayoverRooms', JSON.stringify(
        stayoverRooms.filter(room => room.trim()).map(room => parseInt(room))
      ))
      formData.append('arrivals', arrivals.trim())
      formData.append('departures', departures.trim())
      formData.append('occupancyPercentage', occupancyPercentage.trim())
      
      files.forEach(file => formData.append('files', file))

      const response = await fetch('/api/reports/create', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        if (shouldLogout) {
          await signOut({ callbackUrl: '/login' })
        } else {
          router.push('/dashboard')
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create report')
      }
    } catch (error) {
      console.error('Error creating report:', error)
      setError('An error occurred while creating the report')
    } finally {
      setLoading(false)
    }
  }

  if (dailyPostCount >= 25) {
    return (
      <Card className="max-w-2xl mx-auto casino-card">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-200 mb-2">Daily Limit Reached</h2>
          <p className="text-gray-400 mb-4">
            You have reached the daily limit of 25 reports. Please try again tomorrow.
          </p>
          <Button 
            onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-4xl mx-auto casino-card">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-bold text-gray-100">
              New Shift Report
            </CardTitle>
            <p className="text-gray-400 mt-1 text-sm">
              Fill out the form below to create a new shift report. At least one field must be filled.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-400">
              Reports today: <span className="font-semibold text-[#A88F4A]">{dailyPostCount}/25</span>
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <TooltipProvider>
          <form className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-300 bg-red-950/50 border border-red-900/50 rounded-lg">
                {error}
              </div>
            )}

          {/* Priority Selection */}
          <div>
            <Label htmlFor="priority" className="text-gray-200 font-medium">Priority Level</Label>
            <Select value={priority} onValueChange={(value: Priority) => setPriority(value)}>
              <SelectTrigger className="mt-1 bg-black border-[#C8A859]/30 text-gray-100 focus:ring-[#C8A859] rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-[#C8A859]/30 rounded-none">
                <SelectItem value={Priority.NONE}>None</SelectItem>
                <SelectItem value={Priority.LOW}>Low</SelectItem>
                <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
                <SelectItem value={Priority.HIGH}>High</SelectItem>
              </SelectContent>
            </Select>
            
            {priority === Priority.HIGH && (
              <div className="mt-2 p-3 text-sm text-red-300 bg-red-950/50 border border-red-900/50 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Please immediately contact your manager before finishing this report
              </div>
            )}
          </div>

          {/* Body Text */}
          <div>
            <Label htmlFor="bodyText" className="text-gray-200 font-medium">Report Details</Label>
            <Textarea
              id="bodyText"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Enter the details of your shift report..."
              rows={6}
              className="mt-1 bg-black border-[#C8A859]/30 text-gray-100 placeholder:text-gray-500 focus:ring-[#C8A859] rounded-none"
            />
          </div>

          {/* Noted Rooms */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Label className="text-gray-200 font-medium">Noted Rooms</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Enter any room numbers mentioned in your report. This is for rooms that are referenced in the report body but do not pertain to stayovers (unless they overlap). Maximum 50 rooms.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              {notedRooms.length < 50 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addRoomField('noted')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Room
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {notedRooms.map((room, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={room}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      updateRoom('noted', index, value)
                    }}
                    placeholder="Room number"
                    className="flex-1 bg-black border-[#C8A859]/30 text-gray-100 placeholder:text-gray-500 focus:ring-[#C8A859] rounded-none"
                  />
                  {notedRooms.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeRoomField('noted', index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stayover Rooms */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-gray-200 font-medium">Stayover Rooms</Label>
              {stayoverRooms.length < 50 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addRoomField('stayover')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Room
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {stayoverRooms.map((room, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={room}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      updateRoom('stayover', index, value)
                    }}
                    placeholder="Room number"
                    className="flex-1 bg-black border-[#C8A859]/30 text-gray-100 placeholder:text-gray-500 focus:ring-[#C8A859] rounded-none"
                  />
                  {stayoverRooms.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeRoomField('stayover', index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* EOD Statistics */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-base font-medium text-gray-200">EOD Statistics</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p><strong>Arrivals:</strong> Number of new guest check-ins<br/>
                  <strong>Departures:</strong> Number of guest check-outs<br/>
                  <strong>Occupancy:</strong> Percentage of rooms occupied</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="arrivals" className="text-sm text-gray-300">Number of Arrivals</Label>
                <Input
                  id="arrivals"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={arrivals}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setArrivals(value)
                  }}
                  placeholder="0"
                  className="mt-1 bg-black border-[#C8A859]/30 text-gray-100 placeholder:text-gray-500 focus:ring-[#C8A859] rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="departures" className="text-sm text-gray-300">Number of Departures</Label>
                <Input
                  id="departures"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={departures}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setDepartures(value)
                  }}
                  placeholder="0"
                  className="mt-1 bg-black border-[#C8A859]/30 text-gray-100 placeholder:text-gray-500 focus:ring-[#C8A859] rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="occupancy" className="text-sm text-gray-300">Occupancy Percentage</Label>
                <Input
                  id="occupancy"
                  type="text"
                  inputMode="decimal"
                  value={occupancyPercentage}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '')
                    // Allow only one decimal point and up to 3 decimal places
                    const parts = value.split('.')
                    if (parts.length <= 2 && (!parts[1] || parts[1].length <= 3)) {
                      const numValue = parseFloat(value)
                      if (value === '' || value.endsWith('.') || (numValue >= 0 && numValue <= 100)) {
                        setOccupancyPercentage(value)
                      }
                    }
                  }}
                  placeholder="0"
                  className="mt-1 bg-black border-[#C8A859]/30 text-gray-100 placeholder:text-gray-500 focus:ring-[#C8A859] rounded-none"
                />
              </div>
            </div>
          </div>

          {/* File Attachments */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-gray-200 font-medium">File Attachments</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Supported file types: Images (JPG, PNG, GIF, etc.), Documents (PDF, DOC, DOCX), Spreadsheets (XLS, XLSX), Text files (TXT, CSV), and ZIP archives. Maximum 3 files, 30MB total.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept={ALLOWED_FILE_EXTENSIONS.join(',')}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={files.length >= 3}
                className="text-xs sm:text-sm"
              >
                <Upload className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Choose Files (Max 3, 30MB total)</span>
              </Button>
              
              {files.length > 0 && (
                <div className="space-y-2 mt-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-black/50 p-3 border border-[#C8A859]/30">
                      <span className="text-sm text-gray-300">
                        {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
                      </span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col gap-3 pt-4 border-t border-border">
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => router.push('/dashboard')}
                disabled={loading}
                style={{ background: '#7f1d1d', border: 'none' }}
                className="text-white hover:opacity-90"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={loading || !isFormValid()}
                className="flex-1 btn-champions-filled"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Submitting...' : 'Submit & Stay Logged In'}
              </Button>
            </div>
            <Button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={loading || !isFormValid()}
              className="w-full btn-champions-filled"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {loading ? 'Submitting...' : 'Submit & Log Out'}
            </Button>
          </div>
        </form>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}

