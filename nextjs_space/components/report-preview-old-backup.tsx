
'use client'

import { useState } from 'react'
import { UserRole, Priority } from '@prisma/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle, AlertCircle, MessageCircle, Paperclip, Download, Trash2, Send } from 'lucide-react'

interface User {
  id: string
  username: string
  role: UserRole
  name?: string | null
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
  createdAt: string
  author: {
    name: string
    username: string
  }
  attachments: {
    filename: string
    originalName: string
  }[]
  comments: {
    id: string
    content: string
    author: {
      name: string
    }
    createdAt: string
  }[]
}

interface ReportPreviewProps {
  report: ShiftReport
  user: User
  expanded: boolean
  onToggleExpand: () => void
}

export default function ReportPreview({ report, user, expanded, onToggleExpand }: ReportPreviewProps) {
  const [newComment, setNewComment] = useState('')
  const [addingComment, setAddingComment] = useState(false)
  const [comments, setComments] = useState(report.comments)

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

  const getBodyPreview = (text: string | null) => {
    if (!text) return 'No content'
    const lines = text.split('\n').filter(line => line.trim())
    return lines.slice(0, 2).join('\n')
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || addingComment) return

    setAddingComment(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftReportId: report.id,
          content: newComment.trim(),
        }),
      })

      if (response.ok) {
        const comment = await response.json()
        setComments(prev => [...prev, comment])
        setNewComment('')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setAddingComment(false)
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

  const canComment = user.role === UserRole.MANAGER || user.role === UserRole.SUPER_ADMIN
  const canExport = user.role === UserRole.MANAGER || user.role === UserRole.SUPER_ADMIN
  const canDelete = user.role === UserRole.SUPER_ADMIN

  // Check if EOD statistics exist
  const hasEODStats = report.arrivals !== null || report.departures !== null || report.occupancyPercentage !== null

  // Check if room information exists
  const hasRoomInfo = report.notedRooms?.length > 0 || report.stayoverRooms?.length > 0

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
        report.priority === Priority.HIGH ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
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
            <h3 className="font-semibold text-lg text-gray-900">
              {report.author.name} - {formatDateTime(report.createdAt)}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {report.priority !== Priority.NONE && (
                <Badge className={getPriorityBadgeColor(report.priority)}>
                  {report.priority}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {report.priority !== Priority.NONE && getPriorityIcon(report.priority)}
            
            {report.attachments?.length > 0 && (
              <div className="flex items-center text-gray-500">
                <Paperclip className="h-4 w-4" />
                <span className="text-xs ml-1">{report.attachments.length}</span>
              </div>
            )}
            
            {comments?.length > 0 && (
              <div className="flex items-center text-gray-500">
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs ml-1">{comments.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Preview Content */}
        {!expanded && (
          <div className="space-y-2">
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {getBodyPreview(report.bodyText)}
            </p>
            
            {hasRoomInfo && (
              <div className="flex gap-4 text-xs text-gray-600">
                {report.notedRooms?.length > 0 && (
                  <span>Noted Rooms: {report.notedRooms.join(', ')}</span>
                )}
                {report.stayoverRooms?.length > 0 && (
                  <span>Stayover Rooms: {report.stayoverRooms.join(', ')}</span>
                )}
              </div>
            )}

            {report.attachments?.length > 0 && (
              <div className="text-xs text-gray-600">
                Files: {report.attachments.map(att => att.originalName).join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Expanded Content */}
        {expanded && (
          <div className="space-y-4 mt-4" onClick={(e) => e.stopPropagation()}>
            {/* Full Body Text */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Report Details</h4>
              <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded">
                {report.bodyText || 'No content provided'}
              </p>
            </div>

            {/* EOD Statistics - Only show if data exists */}
            {hasEODStats && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">EOD Statistics</h4>
                <div className="bg-blue-50 p-3 rounded grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-700">Arrivals:</span>
                    <span className="font-medium text-gray-900 ml-2">
                      {report.arrivals !== null ? report.arrivals : 'n/a'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-700">Departures:</span>
                    <span className="font-medium text-gray-900 ml-2">
                      {report.departures !== null ? report.departures : 'n/a'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-700">Occupancy:</span>
                    <span className="font-medium text-gray-900 ml-2">
                      {report.occupancyPercentage !== null ? `${report.occupancyPercentage}%` : 'n/a'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Room Numbers - Only show if data exists */}
            {hasRoomInfo && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Room Information</h4>
                <div className="bg-gray-100 p-3 rounded space-y-2 text-sm">
                  {report.notedRooms?.length > 0 && (
                    <div>
                      <span className="text-gray-700">Noted Rooms:</span>
                      <span className="font-medium text-gray-900 ml-2">{report.notedRooms.join(', ')}</span>
                    </div>
                  )}
                  {report.stayoverRooms?.length > 0 && (
                    <div>
                      <span className="text-gray-700">Stayover Rooms:</span>
                      <span className="font-medium text-gray-900 ml-2">{report.stayoverRooms.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Attachments */}
            {report.attachments?.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Attachments</h4>
                <div className="space-y-2">
                  {report.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm text-gray-700">{attachment.originalName}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const a = document.createElement('a')
                          a.href = `/api/files/${attachment.filename}`
                          a.download = attachment.originalName
                          a.click()
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Comments ({comments?.length || 0})</h4>
              
              {comments?.length > 0 && (
                <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                  {comments.slice(-5).map((comment) => (
                    <div key={comment.id} className="bg-gray-50 p-2 rounded text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-gray-800">{comment.author.name}</span>
                        <span className="text-xs text-gray-600">
                          {formatDateTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {canComment && (
                <div className="flex gap-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment (max 200 characters)..."
                    maxLength={200}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleAddComment()
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || addingComment}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-gray-200">
              {canExport && (
                <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              )}
              
              {canDelete && (
                <Button variant="outline" size="sm" onClick={handleDeleteReport} className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Report
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
