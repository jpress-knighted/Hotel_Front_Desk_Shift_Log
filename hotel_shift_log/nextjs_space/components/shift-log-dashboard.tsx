
'use client'

import { useState, useEffect } from 'react'
import { UserRole, Priority, CommentType } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Combobox } from '@/components/ui/combobox'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Plus, Search, RotateCcw, MessageCircle, Paperclip, AlertTriangle, AlertCircle, Download, Trash2, ChevronDown } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import Link from 'next/link'
import ReportPreview from '@/components/report-preview'

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
  comments: {
    id: string
    content: string
    commentType: CommentType
    isHidden: boolean
    authorName: string
    author?: {
      id: string
      name: string
    } | null
    likes?: Array<{ userId: string }>
    createdAt: string
    updatedAt: string
  }[]
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

interface FilterState {
  priority: string
  hasAttachments: boolean
  hasComments: boolean
  hasStayovers: boolean
  searchText: string
  employeeFilter: string
  notedRoom: string
  dateRange: DateRange | undefined
  showArchived: boolean
  hideUnarchived: boolean
  resolvedStatus: string
}

interface ShiftLogDashboardProps {
  user: User
}

export default function ShiftLogDashboard({ user }: ShiftLogDashboardProps) {
  const [reports, setReports] = useState<ShiftReport[]>([])
  const [employees, setEmployees] = useState<{ id: string; name: string; username: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [expandedReport, setExpandedReport] = useState<string | null>(null)
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  
  const [filters, setFilters] = useState<FilterState>({
    priority: 'all',
    hasAttachments: false,
    hasComments: false,
    hasStayovers: false,
    searchText: '',
    employeeFilter: 'all',
    notedRoom: '',
    dateRange: undefined,
    showArchived: false,
    hideUnarchived: false,
    resolvedStatus: 'all',
  })

  useEffect(() => {
    loadEmployees()
    loadReports(true)
  }, [])

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      }
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  const loadReports = async (reset = false) => {
    if (reset) {
      setLoading(true)
      setPage(1)
    } else {
      setLoadingMore(true)
    }

    try {
      const params = new URLSearchParams({
        page: reset ? '1' : page.toString(),
        limit: '25',
      })

      // Add filters to params
      if (filters.priority && filters.priority !== 'all') {
        params.append('priority', filters.priority)
      }
      if (filters.hasAttachments) {
        params.append('hasAttachments', 'true')
      }
      if (filters.hasComments) {
        params.append('hasComments', 'true')
      }
      if (filters.hasStayovers) {
        params.append('hasStayovers', 'true')
      }
      if (filters.searchText) {
        params.append('searchText', filters.searchText)
      }
      if (filters.employeeFilter && filters.employeeFilter !== 'all') {
        params.append('employeeFilter', filters.employeeFilter)
      }
      if (filters.notedRoom) {
        params.append('notedRoom', filters.notedRoom)
      }
      if (filters.dateRange?.from) {
        params.append('dateFrom', format(filters.dateRange.from, 'yyyy-MM-dd'))
      }
      if (filters.dateRange?.to) {
        params.append('dateTo', format(filters.dateRange.to, 'yyyy-MM-dd'))
      }
      if (filters.showArchived) {
        params.append('showArchived', 'true')
      }
      if (filters.hideUnarchived) {
        params.append('hideUnarchived', 'true')
      }
      if (filters.resolvedStatus && filters.resolvedStatus !== 'all') {
        params.append('resolvedStatus', filters.resolvedStatus)
      }

      const response = await fetch(`/api/reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        
        if (reset) {
          setReports(data.reports)
        } else {
          setReports(prev => [...prev, ...data.reports])
        }
        
        setHasMore(data.hasMore)
        if (!reset) setPage(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleFilterUpdate = () => {
    loadReports(true)
  }

  const handleClearFilters = () => {
    const clearedFilters = {
      priority: 'all',
      hasAttachments: false,
      hasComments: false,
      hasStayovers: false,
      searchText: '',
      employeeFilter: 'all',
      notedRoom: '',
      dateRange: undefined,
      showArchived: false,
      hideUnarchived: false,
      resolvedStatus: 'all',
    }
    setFilters(clearedFilters)
    // Auto-apply after clearing
    setTimeout(() => loadReports(true), 100)
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading shift reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card className="casino-card">
        <CardHeader 
          className="border-b border-gray-700/50 cursor-pointer hover:bg-gray-800/30 transition-colors"
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-100">Filter Reports</CardTitle>
            <ChevronDown 
              className={`h-6 w-6 text-gray-100 transition-transform duration-200 ${
                isFiltersExpanded ? 'transform rotate-180' : ''
              }`}
            />
          </div>
        </CardHeader>
        {isFiltersExpanded && (
          <CardContent className="p-6">
          {/* First Row: Priority, Report Status, Staff on Shift, Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="priority" className="text-gray-200 font-medium mb-1.5 block">Priority Level</Label>
              <Select 
                value={filters.priority} 
                onValueChange={(value) => setFilters(prev => ({...prev, priority: value}))}
              >
                <SelectTrigger className="bg-gray-900/50 border-gray-700/50 text-gray-100 focus:ring-yellow-600">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700/50">
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="NONE">None</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="resolved-status" className="text-gray-200 font-medium mb-1.5 block">Report Status</Label>
              <Select 
                value={filters.resolvedStatus} 
                onValueChange={(value) => setFilters(prev => ({...prev, resolvedStatus: value}))}
              >
                <SelectTrigger className="bg-gray-900/50 border-gray-700/50 text-gray-100 focus:ring-yellow-600">
                  <SelectValue placeholder="All Reports" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700/50">
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="unresolved">Unresolved</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="employee" className="text-gray-200 font-medium mb-1.5 block">Staff on Shift</Label>
              <Combobox
                options={[
                  { value: 'all', label: 'All Staff' },
                  ...employees?.map((employee) => ({
                    value: employee.id,
                    label: employee.name
                  })) || []
                ]}
                value={filters.employeeFilter}
                onChange={(value) => setFilters(prev => ({...prev, employeeFilter: value}))}
                placeholder="All Staff"
                emptyMessage="No staff found."
              />
            </div>

            <div>
              <Label htmlFor="date-range" className="text-gray-200 font-medium mb-1.5 block">Date Range</Label>
              <DateRangePicker
                value={filters.dateRange || { from: undefined, to: undefined }}
                onChange={(value) => setFilters(prev => ({...prev, dateRange: value}))}
              />
            </div>
          </div>

          {/* Second Row: Text Contains and Noted Room Number */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="search" className="text-gray-200 font-medium mb-1.5 block">Text Contains</Label>
              <Input
                id="search"
                value={filters.searchText}
                onChange={(e) => setFilters(prev => ({...prev, searchText: e.target.value}))}
                placeholder="Search in report details or attachments"
                className="bg-gray-900/50 border-gray-700/50 text-gray-100"
              />
            </div>

            <div>
              <Label htmlFor="noted-room" className="text-gray-200 font-medium mb-1.5 block">Noted Room Number</Label>
              <Input
                id="noted-room"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={filters.notedRoom}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '')
                  setFilters(prev => ({...prev, notedRoom: value}))
                }}
                placeholder="Room number"
                className="bg-gray-900/50 border-gray-700/50 text-gray-100"
              />
            </div>
          </div>

          {/* More Options */}
          <div className="mb-4">
            <Label className="text-gray-200 font-medium mb-1.5 block">More Options</Label>
            <div className="border border-gray-700/50 px-3 py-2 rounded-md w-full bg-gray-900/30 min-h-[2.5rem] flex items-center">
              <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-2 w-full">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="has-stayovers"
                    checked={filters.hasStayovers}
                    onCheckedChange={(checked) => setFilters(prev => ({...prev, hasStayovers: !!checked}))}
                  />
                  <Label htmlFor="has-stayovers" className="text-gray-200 cursor-pointer text-sm whitespace-nowrap">Has Stayovers</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="has-attachments"
                    checked={filters.hasAttachments}
                    onCheckedChange={(checked) => setFilters(prev => ({...prev, hasAttachments: !!checked}))}
                  />
                  <Label htmlFor="has-attachments" className="text-gray-200 cursor-pointer text-sm whitespace-nowrap">Has Attachments</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="has-comments"
                    checked={filters.hasComments}
                    onCheckedChange={(checked) => setFilters(prev => ({...prev, hasComments: !!checked}))}
                  />
                  <Label htmlFor="has-comments" className="text-gray-200 cursor-pointer text-sm whitespace-nowrap">Has Comments</Label>
                </div>

                {(user.role === UserRole.MANAGER || user.role === UserRole.SUPER_ADMIN) && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-archived"
                        checked={filters.showArchived}
                        onCheckedChange={(checked) => setFilters(prev => ({...prev, showArchived: !!checked}))}
                      />
                      <Label htmlFor="show-archived" className="text-gray-200 cursor-pointer text-sm whitespace-nowrap">Show Archived Reports</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="hide-unarchived"
                        checked={filters.hideUnarchived}
                        onCheckedChange={(checked) => setFilters(prev => ({...prev, hideUnarchived: !!checked}))}
                      />
                      <Label htmlFor="hide-unarchived" className="text-gray-200 cursor-pointer text-sm whitespace-nowrap">Hide Unarchived Reports</Label>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleFilterUpdate} className="flex-1 sm:flex-initial btn-champions">
              <Search className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
            <Button variant="outline" onClick={handleClearFilters} className="flex-1 sm:flex-initial btn-champions">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
        )}
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <p className="text-white text-center py-4">No shift reports found matching your criteria.</p>
        ) : (
          reports?.map((report) => (
            <ReportPreview
              key={report.id}
              report={report}
              user={user}
              expanded={expandedReport === report.id}
              onToggleExpand={() => setExpandedReport(
                expandedReport === report.id ? null : report.id
              )}
              onReportUpdate={(updatedReport) => {
                setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r))
              }}
            />
          ))
        )}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => loadReports(false)}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : 'See More'}
          </Button>
        </div>
      )}
    </div>
  )
}
