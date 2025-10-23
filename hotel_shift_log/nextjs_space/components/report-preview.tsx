
'use client'

import { useState, useRef } from 'react'
import { UserRole, Priority, CommentType } from '@prisma/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, AlertCircle, MessageCircle, Paperclip, Download, Trash2, Send, EyeOff, Eye, ImageIcon, X, Check, CheckCircle2, ThumbsUp } from 'lucide-react'
import Image from 'next/image'

interface User {
  id: string
  username: string
  role: UserRole
  name?: string | null
}

interface Comment {
  id: string
  content: string
  commentType: CommentType
  isHidden: boolean
  imageUrl?: string | null
  originalFileName?: string | null
  authorName: string
  author?: {
    id: string
    name: string
  } | null
  likes?: Array<{ userId: string }>
  createdAt: string
  updatedAt: string
}

interface ShiftReport {
  id: string
  priority: Priority
  bodyText: string | null
  notedRooms: number[]
  stayoverRooms: number[]
  arrivals: number | null
  departures: number | null
  occupancyPercentage: number | null
  isHidden: boolean
  isResolved: boolean
  createdAt: string
  authorName: string
  author?: {
    name: string
    username: string
  } | null
  attachments: {
    filename: string
    originalName: string
  }[]
  comments: Comment[]
  acknowledgements: {
    id: string
    userId: string
    acknowledgedAt: string
    user: {
      id: string
      name: string
      username: string
      role: UserRole
    }
  }[]
}

interface ReportPreviewProps {
  report: ShiftReport
  user: User
  expanded: boolean
  onToggleExpand: () => void
  onReportUpdate: (updatedReport: ShiftReport) => void
}

export default function ReportPreview({ report, user, expanded, onToggleExpand, onReportUpdate }: ReportPreviewProps) {
  const [newComment, setNewComment] = useState('')
  const [addingComment, setAddingComment] = useState(false)
  const [comments, setComments] = useState(report.comments)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null)
  const [likedByNames, setLikedByNames] = useState<Record<string, string[]>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ALLOWED_FILE_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
    '.pdf',
    '.doc', '.docx',
    '.xls', '.xlsx',
    '.ppt', '.pptx',
    '.txt', '.csv',
    '.zip'
  ]

  const isImageFile = (url: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
    const extension = url.toLowerCase().substring(url.lastIndexOf('.'))
    return imageExtensions.includes(extension)
  }

  const getFileName = (url: string, originalFileName?: string | null) => {
    if (originalFileName) {
      return originalFileName
    }
    const parts = url.split('/')
    return parts[parts.length - 1]
  }

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case Priority.HIGH:
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case Priority.MEDIUM:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case Priority.LOW:
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const getPriorityBadgeColor = (priority: Priority) => {
    switch (priority) {
      case Priority.HIGH:
        return 'bg-red-100 text-red-800'
      case Priority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800'
      case Priority.LOW:
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCommentDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2)
    let hours = date.getHours()
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    
    return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`
  }

  const getBodyPreview = (text: string | null) => {
    if (!text) return 'No content'
    const lines = text.split('\n').filter(line => line.trim())
    return lines.slice(0, 2).join('\n')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const validateAndSetFile = (file: File) => {
    // Validate file type by extension
    const fileName = file.name.toLowerCase()
    const extension = '.' + fileName.split('.').pop()
    
    if (!ALLOWED_FILE_EXTENSIONS.includes(extension)) {
      alert('File type not allowed. Please upload images, PDFs, Office documents, text files, or ZIP files.')
      return
    }

    // Validate file size (30MB max)
    if (file.size > 30 * 1024 * 1024) {
      alert('File size must be less than 30MB')
      return
    }

    setSelectedFile(file)
    setNewComment('') // Clear text when file is selected
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      // Support pasting files (primarily images from clipboard)
      if (item.kind === 'file') {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          validateAndSetFile(file)
        }
        break
      }
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAddComment = async (commentType: CommentType) => {
    if ((!newComment.trim() && !selectedFile) || addingComment) return

    setAddingComment(true)
    try {
      const formData = new FormData()
      formData.append('shiftReportId', report.id)
      formData.append('commentType', commentType)
      
      if (selectedFile) {
        formData.append('image', selectedFile)
        formData.append('content', '') // Empty content for file comments
      } else {
        formData.append('content', newComment.trim())
      }

      const response = await fetch('/api/comments', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const comment = await response.json()
        setComments(prev => [...prev, comment])
        setNewComment('')
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add comment')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('Failed to add comment')
    } finally {
      setAddingComment(false)
    }
  }

  const handleHideComment = async (commentId: string, isHidden: boolean) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden: !isHidden }),
      })

      if (response.ok) {
        const updatedComment = await response.json()
        setComments(prev => prev.map(c => c.id === commentId ? updatedComment : c))
      }
    } catch (error) {
      console.error('Error hiding comment:', error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId))
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const handleLikeComment = async (commentId: string, commentAuthorId: string | undefined) => {
    // Users can't like their own comments
    if (commentAuthorId && user.id === commentAuthorId) {
      return
    }

    // Check if already liked
    const comment = comments.find(c => c.id === commentId)
    const alreadyLiked = comment?.likes?.some(like => like.userId === user.id)
    
    if (alreadyLiked) {
      // Already liked - do nothing (likes are permanent)
      return
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
      })

      if (response.ok) {
        const { liked } = await response.json()
        
        // Add the current user's like to local state
        if (liked) {
          setComments(prev => prev.map(c => {
            if (c.id === commentId) {
              const currentLikes = c.likes || []
              return { ...c, likes: [...currentLikes, { userId: user.id }] }
            }
            return c
          }))
          
          // Clear the cached liked by names so it refetches with the new like
          setLikedByNames(prev => {
            const newState = { ...prev }
            delete newState[commentId]
            return newState
          })
        }
      }
    } catch (error) {
      console.error('Error liking comment:', error)
    }
  }

  const fetchLikedByNames = async (commentId: string) => {
    if (likedByNames[commentId]) {
      // Already fetched
      return
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/likes`)
      if (response.ok) {
        const { likedBy } = await response.json()
        setLikedByNames(prev => ({ ...prev, [commentId]: likedBy }))
      }
    } catch (error) {
      console.error('Error fetching liked by names:', error)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      const response = await fetch(`/api/reports/${report.id}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `shift-report-${report.id}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
    }
  }

  const handleHideReport = async () => {
    const action = report.isHidden ? 'unarchive' : 'archive'
    if (!window.confirm(`Are you sure you want to ${action} this report?`)) {
      return
    }

    try {
      const response = await fetch(`/api/reports/${report.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden: !report.isHidden }),
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Error archiving report:', error)
    }
  }

  const handleDeleteReport = async () => {
    if (!window.confirm('Are you sure you want to delete this report? Please download it before deleting if needed.')) {
      return
    }

    try {
      const response = await fetch(`/api/reports/${report.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Error deleting report:', error)
    }
  }

  const handleAcknowledge = async () => {
    try {
      const response = await fetch(`/api/reports/${report.id}/acknowledge`, {
        method: 'POST',
      })
      
      if (response.ok) {
        // Fetch the updated report
        const reportResponse = await fetch(`/api/reports/${report.id}`)
        if (reportResponse.ok) {
          const updatedReport = await reportResponse.json()
          onReportUpdate(updatedReport)
        }
      }
    } catch (error) {
      console.error('Error acknowledging report:', error)
    }
  }

  const handleResolve = async () => {
    try {
      const response = await fetch(`/api/reports/${report.id}/resolve`, {
        method: 'POST',
      })
      
      if (response.ok) {
        // Fetch the updated report
        const reportResponse = await fetch(`/api/reports/${report.id}`)
        if (reportResponse.ok) {
          const updatedReport = await reportResponse.json()
          onReportUpdate(updatedReport)
        }
      }
    } catch (error) {
      console.error('Error resolving report:', error)
    }
  }

  const canComment = user.role === UserRole.MANAGER || user.role === UserRole.SUPER_ADMIN
  const canExport = true // Everyone can export PDFs now
  const canHide = user.role === UserRole.MANAGER || user.role === UserRole.SUPER_ADMIN
  const canDelete = user.role === UserRole.SUPER_ADMIN
  const isManagerOrAdmin = user.role === UserRole.MANAGER || user.role === UserRole.SUPER_ADMIN
  
  // Check if user has already acknowledged this report
  const hasAcknowledged = report.acknowledgements?.some(ack => ack.userId === user.id) || false
  const canAcknowledge = user.role === UserRole.EMPLOYEE && !hasAcknowledged
  const canResolve = isManagerOrAdmin && !report.isResolved

  // Check if user has reached their comment limit (30 comments per manager)
  const userCommentCount = comments.filter(c => c.author?.id === user.id).length
  const canAddMoreComments = userCommentCount < 30

  // Group comments by author
  const commentsByAuthor = comments.reduce((acc, comment) => {
    const authorId = comment.author?.id || comment.authorName
    if (!acc[authorId]) {
      acc[authorId] = {
        authorId: comment.author?.id,
        authorName: comment.authorName,
        publicComments: [],
        managerNotes: []
      }
    }
    
    if (comment.commentType === CommentType.PUBLIC) {
      acc[authorId].publicComments.push(comment)
    } else {
      acc[authorId].managerNotes.push(comment)
    }
    
    return acc
  }, {} as Record<string, {
    authorId?: string,
    authorName: string,
    publicComments: Comment[],
    managerNotes: Comment[]
  }>)

  // Check if there are any public comments visible to employees
  const hasPublicComments = Object.values(commentsByAuthor).some(
    authorGroup => authorGroup.publicComments.length > 0
  )
  
  // For employees, hide the entire comments section if there are no public comments
  const shouldShowCommentsSection = isManagerOrAdmin || hasPublicComments

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
        report.isHidden 
          ? 'bg-gray-400/40 border-gray-400 opacity-70' 
          : report.priority === Priority.HIGH 
            ? 'bg-gray-200/60 border-red-200' 
            : 'bg-gray-200/60 border-gray-200/60'
      } ${expanded ? 'shadow-lg' : ''}`}
      onClick={!expanded ? onToggleExpand : undefined}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div 
          className="flex items-start justify-between mb-3 cursor-pointer"
          onClick={expanded ? onToggleExpand : undefined}
        >
          <div className="flex-1">
            <h3 className={`font-semibold text-lg ${report.isHidden ? 'text-black' : 'text-gray-900'}`}>
              {report.authorName}
            </h3>
            <p className={`text-sm mt-0.5 ${report.isHidden ? 'text-black' : 'text-gray-600'}`}>
              {formatDateTime(report.createdAt)}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${getPriorityBadgeColor(report.priority)} rounded-none`}>
                {report.priority}
              </Badge>
              {report.isResolved ? (
                <Badge className="bg-green-600 text-white rounded-none">
                  RESOLVED
                </Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-800 rounded-none">
                  UNRESOLVED
                </Badge>
              )}
              {report.isHidden && (user.role === UserRole.MANAGER || user.role === UserRole.SUPER_ADMIN) && (
                <Badge className="bg-gray-600 text-white rounded-none">
                  ARCHIVED
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {report.attachments?.length > 0 && (
              <div className={`flex items-center ${report.isHidden ? 'text-black' : 'text-gray-900'}`}>
                <Paperclip className="h-4 w-4" />
                <span className="text-xs ml-1">{report.attachments.length}</span>
              </div>
            )}
            
            {comments?.length > 0 && (
              <div className={`flex items-center ${report.isHidden ? 'text-black' : 'text-gray-900'}`}>
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs ml-1">{comments.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Preview Content */}
        {!expanded && (
          <div className="space-y-2">
            <p className={`text-sm whitespace-pre-line ${report.isHidden ? 'text-black' : 'text-gray-700'}`}>
              {getBodyPreview(report.bodyText)}
            </p>
            
            {(report.notedRooms?.length > 0 || report.stayoverRooms?.length > 0) && (
              <div className={`flex gap-4 text-xs ${report.isHidden ? 'text-black' : 'text-gray-600'}`}>
                {report.notedRooms?.length > 0 && (
                  <span>Noted Rooms: {report.notedRooms.join(', ')}</span>
                )}
                {report.stayoverRooms?.length > 0 && (
                  <span>Stayover Rooms: {report.stayoverRooms.join(', ')}</span>
                )}
              </div>
            )}

            {report.attachments?.length > 0 && (
              <div className={`text-xs ${report.isHidden ? 'text-black' : 'text-gray-600'}`}>
                Files: {report.attachments.map(att => att.originalName).join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Expanded Content - Two Column Layout */}
        {expanded && (
          <div className="space-y-4 mt-4" onClick={(e) => e.stopPropagation()}>
            {/* Acknowledgements List - Managers and Super Admins Only */}
            {(user.role === UserRole.MANAGER || user.role === UserRole.SUPER_ADMIN) && report.acknowledgements && report.acknowledgements.length > 0 && (
              <div className={`text-sm ${report.isHidden ? 'text-black' : 'text-gray-700'}`}>
                <span className="font-medium">Read by: </span>
                {report.acknowledgements.map((ack, index) => {
                  const isLast = index === report.acknowledgements.length - 1
                  const isSecondToLast = index === report.acknowledgements.length - 2
                  return (
                    <span key={ack.id}>
                      {ack.user.name}
                      {!isLast && (isSecondToLast ? ', and ' : ', ')}
                    </span>
                  )
                })}
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Column (2/3 width on desktop) */}
              <div className="lg:col-span-2 space-y-4 order-3 lg:order-1">
                {/* Attachments */}
                <div className="border border-gray-300 p-3 bg-gray-100/40">
                  <h4 className={`font-medium mb-2 ${report.isHidden ? 'text-black' : 'text-gray-900'}`}>Attachments</h4>
                  {report.attachments?.length === 0 ? (
                    <div className={`text-sm ${report.isHidden ? 'text-black' : 'text-gray-700'}`}>n/a</div>
                  ) : (
                    <div className="space-y-2">
                      {report.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-100/40 p-2 rounded border border-gray-300">
                          <span className={`text-sm ${report.isHidden ? 'text-black' : 'text-gray-700'}`}>{attachment.originalName}</span>
                          <Button
                            size="sm"
                            className="btn-champions-filled h-8 px-3 text-xs"
                            onClick={() => {
                              const a = document.createElement('a')
                              a.href = `/api/files/${attachment.filename}`
                              a.download = attachment.originalName
                              a.click()
                            }}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Report Details */}
                <div className="border border-gray-300 p-3 bg-gray-100/40">
                  <h4 className={`font-medium mb-2 ${report.isHidden ? 'text-black' : 'text-gray-900'}`}>Report Details</h4>
                  <p className={`text-sm whitespace-pre-line ${report.isHidden ? 'text-black' : 'text-gray-700'}`}>
                    {report.bodyText || 'n/a'}
                  </p>
                </div>
              </div>

              {/* Right Column (1/3 width on desktop) */}
              <div className="lg:col-span-1 space-y-4 order-1 lg:order-2">
                {/* Room Information */}
                <div className="border border-gray-300 p-3 bg-gray-100/40">
                  <h4 className={`font-medium mb-2 ${report.isHidden ? 'text-black' : 'text-gray-900'}`}>Room Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className={report.isHidden ? 'text-black' : 'text-gray-700'}>Noted Rooms:</span>
                      <span className={`font-medium ml-2 ${report.isHidden ? 'text-black' : 'text-gray-900'}`}>
                        {report.notedRooms?.length > 0 ? report.notedRooms.join(', ') : 'n/a'}
                      </span>
                    </div>
                    <div>
                      <span className={report.isHidden ? 'text-black' : 'text-gray-700'}>Stayover Rooms:</span>
                      <span className={`font-medium ml-2 ${report.isHidden ? 'text-black' : 'text-gray-900'}`}>
                        {report.stayoverRooms?.length > 0 ? report.stayoverRooms.join(', ') : 'n/a'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* EOD Statistics */}
                <div className="border border-gray-300 p-3 bg-gray-100/40">
                  <h4 className={`font-medium mb-2 ${report.isHidden ? 'text-black' : 'text-gray-900'}`}>EOD Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className={report.isHidden ? 'text-black' : 'text-gray-700'}>Arrivals:</span>
                      <span className={`font-medium ml-2 ${report.isHidden ? 'text-black' : 'text-gray-900'}`}>
                        {report.arrivals !== null ? report.arrivals : 'n/a'}
                      </span>
                    </div>
                    <div>
                      <span className={report.isHidden ? 'text-black' : 'text-gray-700'}>Departures:</span>
                      <span className={`font-medium ml-2 ${report.isHidden ? 'text-black' : 'text-gray-900'}`}>
                        {report.departures !== null ? report.departures : 'n/a'}
                      </span>
                    </div>
                    <div>
                      <span className={report.isHidden ? 'text-black' : 'text-gray-700'}>Occupancy:</span>
                      <span className={`font-medium ml-2 ${report.isHidden ? 'text-black' : 'text-gray-900'}`}>
                        {report.occupancyPercentage !== null ? `${report.occupancyPercentage}%` : 'n/a'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section - Full Width Below */}
            {shouldShowCommentsSection && (
              <div className="order-4">
                <h4 className={`font-medium mb-2 ${report.isHidden ? 'text-black' : 'text-gray-900'}`}>Manager Comments</h4>
                
                {Object.keys(commentsByAuthor).length > 0 && (
                <div className="space-y-3 mb-3">
                  {Object.values(commentsByAuthor).map((authorGroup) => (
                    <div key={authorGroup.authorId || 'deleted'} className="bg-gray-100/40 p-3 text-sm border border-gray-300">
                      <div className={`font-medium mb-2 ${report.isHidden ? 'text-black' : 'text-gray-800'}`}>
                        {authorGroup.authorName}
                      </div>
                      
                      {/* Separator line after author name */}
                      <div className="border-t border-gray-400 my-2"></div>
                      
                      {/* Public Comments */}
                      {authorGroup.publicComments.length > 0 && (
                        <div className="mb-2">
                          {isManagerOrAdmin && (
                            <div className={`text-xs font-medium italic mb-1 ${report.isHidden ? 'text-black' : 'text-gray-700'}`}>
                              Public comments:
                            </div>
                          )}
                          <div className="space-y-1">
                            {authorGroup.publicComments.map((comment) => (
                              <div key={comment.id} className={`flex items-start gap-2 ${comment.isHidden ? 'opacity-60' : ''}`}>
                                <div className="flex-1">
                                  {comment.imageUrl ? (
                                    <div>
                                      <div className={`text-xs mb-1 ${report.isHidden ? 'text-black' : 'text-gray-600'}`}>
                                        {formatCommentDateTime(comment.createdAt)}:
                                      </div>
                                      {isImageFile(comment.imageUrl) ? (
                                        <div className="relative w-full max-w-md aspect-video bg-muted rounded-md overflow-hidden">
                                          <Image
                                            src={comment.imageUrl}
                                            alt="Comment attachment"
                                            fill
                                            className="object-contain"
                                          />
                                        </div>
                                      ) : (
                                        <a
                                          href={comment.imageUrl}
                                          download={comment.originalFileName || getFileName(comment.imageUrl)}
                                          className={`underline hover:no-underline ${report.isHidden ? 'text-black' : 'text-gray-700'}`}
                                        >
                                          {getFileName(comment.imageUrl, comment.originalFileName)}
                                        </a>
                                      )}
                                    </div>
                                  ) : (
                                    <span className={report.isHidden ? 'text-black' : 'text-gray-700'}>
                                      {formatCommentDateTime(comment.createdAt)}: {comment.content}
                                    </span>
                                  )}
                                  {comment.isHidden && isManagerOrAdmin && (
                                    <Badge variant="outline" className="text-xs ml-2">Hidden</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 ml-auto shrink-0">
                                  {/* Like button - only show for manager comments */}
                                  {comment.commentType === CommentType.PUBLIC && (comment.likes || []).length >= 0 && (
                                    <div 
                                      className="relative"
                                      onMouseEnter={() => {
                                        setHoveredCommentId(comment.id)
                                        fetchLikedByNames(comment.id)
                                      }}
                                      onMouseLeave={() => setHoveredCommentId(null)}
                                    >
                                      <Button
                                        size="sm"
                                        className={`h-6 px-2 text-xs w-16 border-2 ${
                                          comment.author?.id === user.id
                                            ? 'bg-gray-500 hover:bg-gray-500 cursor-not-allowed opacity-60 border-gray-400'
                                            : (comment.likes || []).some(like => like.userId === user.id)
                                            ? 'bg-gray-600 hover:bg-gray-700 border-green-600'
                                            : 'bg-gray-600 hover:bg-gray-700 border-yellow-600'
                                        } text-white flex items-center gap-1 justify-center`}
                                        onClick={() => handleLikeComment(comment.id, comment.author?.id)}
                                        title={comment.author?.id === user.id ? 'Cannot like your own comment' : (comment.likes || []).some(like => like.userId === user.id) ? 'Already liked' : 'Like comment'}
                                        disabled={comment.author?.id === user.id}
                                      >
                                        <ThumbsUp className={`h-3 w-3 flex-shrink-0 ${(comment.likes || []).some(like => like.userId === user.id) ? 'text-green-600 fill-green-600' : ''}`} />
                                        <span className="text-xs font-semibold text-white">
                                          {(comment.likes || []).length}
                                        </span>
                                      </Button>
                                      
                                      {/* Hover tooltip showing who liked */}
                                      {hoveredCommentId === comment.id && (comment.likes || []).length > 0 && likedByNames[comment.id] && (
                                        <div className="absolute z-10 bottom-full mb-1 right-0 bg-gray-900 text-white text-xs rounded px-3 py-2 shadow-lg whitespace-nowrap">
                                          <div className="font-semibold mb-1">Liked by:</div>
                                          {likedByNames[comment.id].map((name, idx) => (
                                            <div key={idx} className="ml-2">• {name}</div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {isManagerOrAdmin && comment.author?.id === user.id && (
                                    <Button
                                      size="sm"
                                      className="h-6 px-2 text-xs bg-gray-600 hover:bg-gray-700 text-white"
                                      onClick={() => handleHideComment(comment.id, comment.isHidden)}
                                      title={comment.isHidden ? 'Unhide comment' : 'Hide comment'}
                                    >
                                      {comment.isHidden ? (
                                        <>
                                          <Eye className="h-3 w-3" />
                                          <span className="ml-1 hidden sm:inline">Unhide</span>
                                        </>
                                      ) : (
                                        <>
                                          <EyeOff className="h-3 w-3" />
                                          <span className="ml-1 hidden sm:inline">Hide</span>
                                        </>
                                      )}
                                    </Button>
                                  )}
                                  {user.role === UserRole.SUPER_ADMIN && (
                                    <Button
                                      size="sm"
                                      className="h-6 px-2 text-xs bg-red-600 hover:bg-red-700 text-white"
                                      onClick={() => handleDeleteComment(comment.id)}
                                      title="Delete comment"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      <span className="ml-1 hidden sm:inline">Delete</span>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Separator line between public comments and manager notes */}
                      {isManagerOrAdmin && authorGroup.publicComments.length > 0 && authorGroup.managerNotes.length > 0 && (
                        <div className="border-t border-gray-400 my-2"></div>
                      )}
                      
                      {/* Manager Notes (only visible to managers and super admins) */}
                      {isManagerOrAdmin && authorGroup.managerNotes.length > 0 && (
                        <div>
                          <div className={`text-xs font-medium italic mb-1 ${report.isHidden ? 'text-black' : 'text-gray-700'}`}>
                            Manager notes (not visible to staff):
                          </div>
                          <div className="space-y-1">
                            {authorGroup.managerNotes.map((comment) => (
                              <div key={comment.id} className="flex items-start gap-2">
                                <div className="flex-1">
                                  {comment.imageUrl ? (
                                    <div>
                                      <div className={`text-xs mb-1 ${report.isHidden ? 'text-black' : 'text-gray-600'}`}>
                                        {formatCommentDateTime(comment.createdAt)}:
                                      </div>
                                      {isImageFile(comment.imageUrl) ? (
                                        <div className="relative w-full max-w-md aspect-video bg-muted rounded-md overflow-hidden">
                                          <Image
                                            src={comment.imageUrl}
                                            alt="Comment attachment"
                                            fill
                                            className="object-contain"
                                          />
                                        </div>
                                      ) : (
                                        <a
                                          href={comment.imageUrl}
                                          download={comment.originalFileName || getFileName(comment.imageUrl)}
                                          className={`underline hover:no-underline ${report.isHidden ? 'text-black' : 'text-gray-700'}`}
                                        >
                                          {getFileName(comment.imageUrl, comment.originalFileName)}
                                        </a>
                                      )}
                                    </div>
                                  ) : (
                                    <span className={report.isHidden ? 'text-black' : 'text-gray-700'}>
                                      {formatCommentDateTime(comment.createdAt)}: {comment.content}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 ml-auto shrink-0">
                                  {/* Like button for manager notes */}
                                  {(comment.likes || []).length >= 0 && (
                                    <div 
                                      className="relative"
                                      onMouseEnter={() => {
                                        setHoveredCommentId(comment.id)
                                        fetchLikedByNames(comment.id)
                                      }}
                                      onMouseLeave={() => setHoveredCommentId(null)}
                                    >
                                      <Button
                                        size="sm"
                                        className={`h-6 px-2 text-xs w-16 border-2 ${
                                          comment.author?.id === user.id
                                            ? 'bg-gray-500 hover:bg-gray-500 cursor-not-allowed opacity-60 border-gray-400'
                                            : (comment.likes || []).some(like => like.userId === user.id)
                                            ? 'bg-gray-600 hover:bg-gray-700 border-green-600'
                                            : 'bg-gray-600 hover:bg-gray-700 border-yellow-600'
                                        } text-white flex items-center gap-1 justify-center`}
                                        onClick={() => handleLikeComment(comment.id, comment.author?.id)}
                                        title={comment.author?.id === user.id ? 'Cannot like your own comment' : (comment.likes || []).some(like => like.userId === user.id) ? 'Already liked' : 'Like comment'}
                                        disabled={comment.author?.id === user.id}
                                      >
                                        <ThumbsUp className={`h-3 w-3 flex-shrink-0 ${(comment.likes || []).some(like => like.userId === user.id) ? 'text-green-600 fill-green-600' : ''}`} />
                                        <span className="text-xs font-semibold text-white">
                                          {(comment.likes || []).length}
                                        </span>
                                      </Button>
                                      
                                      {/* Hover tooltip showing who liked */}
                                      {hoveredCommentId === comment.id && (comment.likes || []).length > 0 && likedByNames[comment.id] && (
                                        <div className="absolute z-10 bottom-full mb-1 right-0 bg-gray-900 text-white text-xs rounded px-3 py-2 shadow-lg whitespace-nowrap">
                                          <div className="font-semibold mb-1">Liked by:</div>
                                          {likedByNames[comment.id].map((name, idx) => (
                                            <div key={idx} className="ml-2">• {name}</div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {user.role === UserRole.SUPER_ADMIN && (
                                    <Button
                                      size="sm"
                                      className="h-6 px-2 text-xs bg-red-600 hover:bg-red-700 text-white"
                                      onClick={() => handleDeleteComment(comment.id)}
                                      title="Delete comment"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      <span className="ml-1 hidden sm:inline">Delete</span>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {canComment && canAddMoreComments && (
                <div className="space-y-2">
                  <div className="space-y-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => {
                        setNewComment(e.target.value)
                        if (e.target.value && selectedFile) {
                          setSelectedFile(null)
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ''
                          }
                        }
                      }}
                      onPaste={handlePaste}
                      placeholder="Add a comment (max 400 characters) or paste file here"
                      maxLength={400}
                      rows={2}
                      disabled={!!selectedFile}
                      className={`bg-gray-100/40 border-gray-300 ${report.isHidden ? 'text-black' : 'text-gray-900'}`}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ALLOWED_FILE_EXTENSIONS.join(',')}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    {selectedFile && (
                      <div className="flex items-center gap-2 p-2 bg-gray-100/40 border border-gray-300">
                        <ImageIcon className={`h-4 w-4 ${report.isHidden ? 'text-black' : 'text-gray-600'}`} />
                        <span className={`text-sm flex-1 ${report.isHidden ? 'text-black' : 'text-gray-700'}`}>
                          {selectedFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="h-6 w-6 p-0 bg-[#B8860B] hover:bg-[#9A7209] text-white flex items-center justify-center"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAddComment(CommentType.PUBLIC)}
                      disabled={(!newComment.trim() && !selectedFile) || addingComment}
                      className="btn-champions-filled text-xs sm:text-sm"
                    >
                      <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Post for everyone
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAddComment(CommentType.MANAGER_NOTE)}
                      disabled={(!newComment.trim() && !selectedFile) || addingComment}
                      className="btn-champions-filled text-xs sm:text-sm"
                    >
                      <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Save to manager notes
                    </Button>
                  </div>
                </div>
              )}

              {canComment && !canAddMoreComments && (
                <p className={`text-sm italic ${report.isHidden ? 'text-black' : 'text-gray-600'}`}>
                  You have reached the maximum number of comments (30) for this report.
                </p>
              )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-300 justify-between items-center">
              <div className="flex flex-wrap gap-2">
                {canExport && (
                  <Button size="sm" onClick={handleDownloadPdf} className="btn-champions-filled text-xs sm:text-sm">
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Download PDF</span>
                  </Button>
                )}
                
                {canHide && (
                  <Button size="sm" onClick={handleHideReport} className="btn-champions-filled text-xs sm:text-sm">
                    <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{report.isHidden ? 'Unarchive Report' : 'Archive Report'}</span>
                  </Button>
                )}
                
                {canDelete && (
                  <Button size="sm" onClick={handleDeleteReport} className="btn-champions-filled bg-red-600 hover:bg-red-700 text-xs sm:text-sm">
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Delete Report</span>
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                {/* Employee Acknowledge Button */}
                {canAcknowledge && (
                  <Button size="sm" onClick={handleAcknowledge} className="btn-champions-filled text-xs sm:text-sm">
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span>Mark as Read</span>
                  </Button>
                )}
                
                {/* Show "Read" status if already acknowledged */}
                {user.role === UserRole.EMPLOYEE && hasAcknowledged && (
                  <Button size="sm" disabled className="bg-green-600 hover:bg-green-600 text-white text-xs sm:text-sm cursor-default">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2 text-white" />
                    <span className="text-white">Read</span>
                  </Button>
                )}

                {/* Manager/Admin Resolve Button */}
                {canResolve && (
                  <Button size="sm" onClick={handleResolve} className="btn-champions-filled text-xs sm:text-sm">
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span>Mark as Resolved</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
