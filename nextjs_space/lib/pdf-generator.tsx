
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// Create styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  text: {
    marginBottom: 3,
    lineHeight: 1.4,
  },
  boldText: {
    fontWeight: 'bold',
  },
  priorityBox: {
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  priorityHigh: {
    backgroundColor: '#fef2f2',
    borderLeftColor: '#ef4444',
  },
  priorityMedium: {
    backgroundColor: '#fffbeb',
    borderLeftColor: '#f59e0b',
  },
  priorityLow: {
    backgroundColor: '#eff6ff',
    borderLeftColor: '#3b82f6',
  },
  statsBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    marginTop: 5,
  },
  commentsBox: {
    backgroundColor: '#f1f5f9',
    padding: 10,
    marginTop: 5,
  },
  comment: {
    backgroundColor: '#ffffff',
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
  },
})

interface ReportData {
  id: string
  priority: string
  bodyText: string | null
  notedRooms: number[]
  stayoverRooms: number[]
  arrivals: number | null
  departures: number | null
  occupancyPercentage: number | null
  createdAt: Date | string
  authorName: string
  author?: {
    name: string
    username: string
  } | null
  attachments: Array<{
    filename: string
    originalName: string
  }>
  comments: Array<{
    id: string
    content: string
    authorName: string
    author?: {
      name: string
    } | null
    createdAt: Date | string
  }>
}

const getPriorityStyle = (priority: string) => {
  switch (priority) {
    case 'HIGH':
      return styles.priorityHigh
    case 'MEDIUM':
      return styles.priorityMedium
    case 'LOW':
      return styles.priorityLow
    default:
      return {}
  }
}

export async function generatePDFBuffer(report: ReportData): Promise<Buffer> {
  const PDFDocument = (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Hotel Shift Report</Text>
          <Text style={styles.text}>
            Author: {report.authorName} {report.author?.username ? `(${report.author.username})` : ''}
          </Text>
          <Text style={styles.text}>
            Date/Time: {new Date(report.createdAt).toLocaleString(undefined, {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          {report.priority !== 'NONE' && (
            <Text style={styles.text}>Priority: {report.priority}</Text>
          )}
        </View>

        {/* Body Text */}
        {report.bodyText && (
          <View style={[styles.section, styles.priorityBox, getPriorityStyle(report.priority)]}>
            <Text style={styles.sectionTitle}>Report Details</Text>
            <Text style={styles.text}>{report.bodyText}</Text>
          </View>
        )}

        {/* EOD Statistics */}
        {(report.arrivals !== null || report.departures !== null || report.occupancyPercentage !== null) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EOD Statistics</Text>
            <View style={styles.statsBox}>
              <Text style={styles.text}>Arrivals: {report.arrivals || 0}</Text>
              <Text style={styles.text}>Departures: {report.departures || 0}</Text>
              <Text style={styles.text}>Occupancy: {report.occupancyPercentage || 0}%</Text>
            </View>
          </View>
        )}

        {/* Room Information */}
        {(report.notedRooms.length > 0 || report.stayoverRooms.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Room Information</Text>
            {report.notedRooms.length > 0 && (
              <View style={{ marginTop: 5 }}>
                <Text style={[styles.text, styles.boldText]}>Noted Rooms:</Text>
                <Text style={styles.text}>{report.notedRooms.join(', ')}</Text>
              </View>
            )}
            {report.stayoverRooms.length > 0 && (
              <View style={{ marginTop: 5 }}>
                <Text style={[styles.text, styles.boldText]}>Stayover Rooms:</Text>
                <Text style={styles.text}>{report.stayoverRooms.join(', ')}</Text>
              </View>
            )}
          </View>
        )}

        {/* Attachments */}
        {report.attachments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attachments</Text>
            {report.attachments.map((att, index) => (
              <Text key={index} style={styles.text}>• {att.originalName}</Text>
            ))}
          </View>
        )}

        {/* Comments */}
        {report.comments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comments</Text>
            <View style={styles.commentsBox}>
              {report.comments.map((comment, index) => (
                <View key={index} style={styles.comment}>
                  <Text style={[styles.text, styles.boldText]}>
                    {comment.authorName} - {new Date(comment.createdAt).toLocaleString(undefined, {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <Text style={styles.text}>{comment.content}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  )

  const buffer = await renderToBuffer(PDFDocument)
  return buffer
}
