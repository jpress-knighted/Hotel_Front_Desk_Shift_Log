
/**
 * Email service for sending high-priority report notifications
 * Compatible with Google Cloud Platform deployment
 */

interface EmailOptions {
  to: string[]
  subject: string
  html: string
  text?: string
}

/**
 * Send email using configured SMTP service
 * For GCP deployment, use SendGrid, Mailgun, or Gmail SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Check if email is configured
    const smtpConfigured = process.env.SMTP_HOST && 
                          process.env.SMTP_USER && 
                          process.env.SMTP_PASSWORD

    if (!smtpConfigured) {
      console.warn('⚠️  Email not configured. Set SMTP environment variables to enable email notifications.')
      console.log('Email would have been sent:', options.subject)
      return false
    }

    // Use nodemailer for email sending
    const nodemailer = require('nodemailer')

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    // Send email
    const info = await transporter.sendMail({
      from: `"Hotel Shift Log" <${process.env.SMTP_USER}>`,
      to: options.to.join(', '),
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Fallback plain text
      html: options.html,
    })

    console.log('✅ Email sent successfully:', info.messageId)
    return true
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    return false
  }
}

/**
 * Send high-priority report notification to designated managers
 */
export async function sendHighPriorityAlert(report: {
  id: string
  authorName: string
  bodyText: string | null
  createdAt: Date
}) {
  try {
    // Get users who should receive high-priority emails
    const { prisma } = require('./db')
    const recipients = await prisma.user.findMany({
      where: {
        receivesHighPriorityEmails: true,
        isArchived: false,
      },
      select: {
        email: true,
        name: true,
      },
    })

    // Filter out users without email addresses
    const validRecipients = recipients.filter((r: any) => r.email)

    if (validRecipients.length === 0) {
      console.warn('⚠️  No users configured to receive high-priority emails.')
      return false
    }

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const reportUrl = `${appUrl}/dashboard?reportId=${report.id}`

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          .button { 
            display: inline-block; 
            background-color: #2563eb; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin-top: 15px;
          }
          .priority-badge { 
            background-color: #dc2626; 
            color: white; 
            padding: 4px 12px; 
            border-radius: 3px; 
            font-weight: bold;
            display: inline-block;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🚨 High Priority Shift Report</h1>
          </div>
          <div class="content">
            <div class="priority-badge">HIGH PRIORITY</div>
            <p><strong>Reported by:</strong> ${report.authorName}</p>
            <p><strong>Date & Time:</strong> ${report.createdAt.toLocaleString()}</p>
            ${report.bodyText ? `
              <p><strong>Report Details:</strong></p>
              <p style="background-color: white; padding: 15px; border-radius: 5px; border-left: 4px solid #dc2626;">
                ${report.bodyText}
              </p>
            ` : ''}
            <a href="${reportUrl}" class="button">View Report Details</a>
          </div>
          <div class="footer">
            <p>This is an automated notification from the Hotel Shift Log Management System.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const emailAddresses = validRecipients.map((r: any) => r.email)

    return await sendEmail({
      to: emailAddresses,
      subject: `🚨 High Priority Shift Report - ${report.authorName}`,
      html,
    })
  } catch (error) {
    console.error('Failed to send high-priority alert:', error)
    return false
  }
}
