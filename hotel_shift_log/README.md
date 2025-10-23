
# Hotel Shift Log Management System

A production-ready, secure shift log management system designed for internal hotel operations, with comprehensive security measures, automated backups, and deployment on Google Cloud Platform.

## 🎯 Overview

This application replaces traditional physical shift logs with a modern, digital solution featuring role-based access control, file attachments, priority alerts, and comprehensive audit trails.

## ✨ Key Features

- **Multi-Role User Management**: Super Admin, Manager, and Employee roles with granular permissions
- **Real-Time Shift Logging**: Create, view, filter, and manage shift reports
- **Priority Email Alerts**: Automatic notifications for high-priority reports to designated managers
- **Manager Comments System**: Public comments and private manager notes with file attachments
- **Interactive Engagement**: Employees can acknowledge reports, managers can resolve them, like/unlike comments
- **Advanced Filtering**: Filter by priority, date range, employee, room numbers, archived status, and more
- **File Attachments**: Support for multiple files (images, PDFs, Office documents) per report and comment
- **Export Functionality**: Export logs to PDF and CSV formats with custom date ranges
- **Security Features**: Rate limiting, input sanitization, secure file handling, encrypted passwords
- **Modern UI**: Responsive design with dark mode support

## 🔐 Security Features

### Built-in Protection Against:
- **DoS/Resource Exhaustion**: Daily post limits (25 per user), file size limits (30MB per file, 90MB per report), comment limits (30 per manager per report)
- **Path Traversal**: Validated file paths, sanitized filenames
- **SQL Injection**: Prisma ORM with parameterized queries
- **Brute Force**: Rate limiting on authentication and API endpoints
- **XSS/CSRF**: Secure headers, input validation, NextAuth.js protection
- **Malicious Uploads**: File type validation, MIME type checking, size restrictions

### Security Headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## 📋 Default User Accounts

### Super Admin
- **Username**: `admin`
- **Password**: `admin123`
- **Permissions**: Full system access, user management, report management, configuration

### Manager
- **Username**: `manager`
- **Password**: `manager123`
- **Permissions**: View all reports, add comments, manage reports, export data

### Employee
- **Username**: `employee`
- **Password**: `employee123`
- **Permissions**: Create reports, view own reports, acknowledge reports

**⚠️ IMPORTANT**: Change all default passwords immediately after deployment.

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: PostgreSQL 14+ with Prisma ORM
- **Email**: Nodemailer (compatible with Gmail SMTP, SendGrid, Mailgun)
- **File Storage**: Local filesystem with secure API routes
- **PDF Generation**: @react-pdf/renderer

---

## 🚀 Simplified Cloud Deployment (Cloud Run + GitHub)

### Quick Start: Push to Deploy in 3 Steps

This application is designed for **zero-code deployment** to Google Cloud Platform using Cloud Run with continuous deployment from GitHub.

#### ✨ Benefits:
- 🚀 **Automatic deployments**: Push to GitHub → auto-deploy to production
- 💰 **Cost-effective**: ~$25-50/month for small hotels
- 🔒 **Secure by default**: HTTPS, managed infrastructure, secret management
- 📈 **Auto-scaling**: Handles 1 to 1000s of users automatically
- 🛠️ **No command-line needed**: Everything via GCP Console UI

### Prerequisites
- Google Cloud account (free tier available)
- GitHub account (free)
- Basic understanding of web browsers (no coding required!)

### Full Deployment Guide

📖 **See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** for complete step-by-step instructions

**Quick Overview**:
1. **Push code to GitHub** (one-time setup)
2. **Create Cloud SQL database** (via GCP Console - 5 minutes)
3. **Deploy to Cloud Run** (connects to GitHub - 5 minutes)
4. **Run database migrations** (via Cloud Shell - 2 minutes)
5. **Done!** Auto-deploys on every GitHub push

**Additional Setup Guides**:
- 📘 [GitHub Setup Guide](./GITHUB_SETUP.md) - How to push code to GitHub
- 🔒 [Security Documentation](./SECURITY.md) - Security features and best practices

---

## 💻 Local Development (Alternative to Cloud Deployment)

### Prerequisites

- Node.js 18+ and Yarn
- PostgreSQL 14+
- Git

### Setup

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/hotel-shift-log.git
cd hotel-shift-log/nextjs_space

# Install dependencies
yarn install

# Create .env file (copy from .env.example and fill in values)
cp .env.example .env
# Edit .env with your database credentials and other config

# Set up local PostgreSQL database
createdb hotel_shift_log

# Run database migrations
npx prisma db push

# Seed database with default users
npx prisma db seed

# Start development server
yarn dev
```

The application will be available at `http://localhost:3000`

### Environment Variables

See `.env.example` for all required environment variables. Key variables:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your application URL
- `SMTP_*`: Email configuration for high-priority alerts

---

## 📖 Usage Guide

### For Employees

1. **Log in** with your credentials
2. **Create Report**: Click "Add Report" button
   - Select priority (Low/Medium/High)
   - Enter room numbers (comma-separated)
   - Add description
   - Attach files if needed (optional)
   - Submit
3. **View Reports**: See your submitted reports on the dashboard
4. **Acknowledge Reports**: Click "Read" button on reports from other shifts

### For Managers

All employee features, plus:

1. **View All Reports**: See reports from all employees
2. **Add Comments**: 
   - Public comments (visible to everyone)
   - Private manager notes (visible only to managers/admins)
   - Attach files to comments
3. **Mark as Resolved**: Mark reports that have been addressed
4. **Filter & Export**: Use advanced filters and export to PDF/CSV
5. **Like Comments**: Engage with other manager comments

### For Super Admins

All manager features, plus:

1. **User Management**:
   - Create new users
   - Edit user roles and permissions
   - Archive/restore users
   - Configure email notification recipients
2. **System Configuration**: Access to all system settings
3. **View Archived Reports**: See historical archived reports

---

## 🔧 Advanced Configuration

### Email Notifications

Configure SMTP settings in your `.env` file or Cloud Run environment variables:

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"  # For Gmail, use App Password
```

**To enable email alerts**:
1. Log in as admin
2. Go to Users page
3. Edit each manager who should receive alerts
4. Toggle "Receives High Priority Emails" to ON
5. Ensure their email address is set

### File Upload Limits

Current limits (configurable in code):
- Max file size: 30MB per file
- Max total size per report: 90MB
- Supported types: Images, PDFs, Office documents, text files

### Rate Limits

Protection against abuse:
- 25 reports per user per day
- 30 manager comments per report
- File size and count validations

---

## 🗄️ Database Management

### Backup Database

```bash
# Local PostgreSQL
pg_dump hotel_shift_log > backup_$(date +%Y%m%d).sql

# Cloud SQL (automatic daily backups enabled by default)
gcloud sql backups create --instance=hotel-shift-log-db
```

### Restore Database

```bash
# List available backups
gcloud sql backups list --instance=hotel-shift-log-db

# Restore from backup
gcloud sql backups restore BACKUP_ID \
  --backup-instance=hotel-shift-log-db \
  --target-instance=hotel-shift-log-db
```

---

## 📧 Email Configuration

The application supports high-priority report notifications. Configure email using one of these providers:

### Option 1: Gmail (Easiest for Testing)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Configure environment variables:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Option 2: SendGrid (Recommended for Production)

1. Create account at https://sendgrid.com/
2. Generate API key
3. Configure environment variables:

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=YOUR_SENDGRID_API_KEY
```

### Option 3: Mailgun

1. Create account at https://www.mailgun.com/
2. Get SMTP credentials from dashboard
3. Configure environment variables:

```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=YOUR_MAILGUN_PASSWORD
```

### Configuring Recipients

1. Log in as Super Admin
2. Navigate to **Users** page
3. For each user who should receive high-priority alerts:
   - Click **Edit**
   - Toggle **Receives High Priority Emails** to ON
   - Ensure their email address is filled in
   - Click **Save**

---

## 💾 Part 4: Automated Backup System

### Cloud Storage for File Backups

```bash
# Create storage bucket for backups
gcloud storage buckets create gs://YOUR_PROJECT_ID-hotel-backups \
  --location=us-central1 \
  --uniform-bucket-level-access

# Enable versioning for backup protection
gcloud storage buckets update gs://YOUR_PROJECT_ID-hotel-backups \
  --versioning

# Set lifecycle rules (keep backups for 90 days)
cat > lifecycle.json << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 90}
      }
    ]
  }
}
EOF

gcloud storage buckets update gs://YOUR_PROJECT_ID-hotel-backups \
  --lifecycle-file=lifecycle.json
```

### Automated Database Backups

Cloud SQL automatically creates daily backups. To customize:

```bash
# Configure backup retention (7 days default)
gcloud sql instances patch hotel-shift-log-db \
  --backup-start-time=02:00 \
  --retained-backups-count=30
```

### File Upload Backups

Create a Cloud Function to backup uploads directory:

```bash
# Create backup function
mkdir -p /tmp/backup-function
cd /tmp/backup-function

cat > main.py << 'EOF'
import os
from google.cloud import storage

def backup_uploads(request):
    """Backup uploads directory to Cloud Storage."""
    bucket_name = os.environ.get('BACKUP_BUCKET')
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    
    # Upload files from /app/uploads
    uploads_dir = '/app/uploads'
    for root, dirs, files in os.walk(uploads_dir):
        for file in files:
            local_path = os.path.join(root, file)
            blob_path = f"uploads/{file}"
            blob = bucket.blob(blob_path)
            blob.upload_from_filename(local_path)
    
    return {'status': 'success'}
EOF

cat > requirements.txt << EOF
google-cloud-storage==2.10.0
EOF

# Deploy function
gcloud functions deploy backup-hotel-uploads \
  --runtime python311 \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars BACKUP_BUCKET=YOUR_PROJECT_ID-hotel-backups
```

### Scheduled Backups

```bash
# Create Cloud Scheduler job for daily backups
gcloud scheduler jobs create http daily-backup \
  --schedule="0 3 * * *" \
  --uri="https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/backup-hotel-uploads" \
  --http-method=POST \
  --time-zone="America/Chicago"
```

### Manual Backup/Restore

**Create manual backup:**
```bash
# Database
gcloud sql backups create --instance=hotel-shift-log-db

# Files
gcloud storage cp -r /path/to/uploads gs://YOUR_PROJECT_ID-hotel-backups/manual-backup-$(date +%Y%m%d)/
```

**Restore from backup:**
```bash
# Database
gcloud sql backups restore BACKUP_ID \
  --backup-instance=hotel-shift-log-db \
  --target-instance=hotel-shift-log-db

# Files
gcloud storage cp -r gs://YOUR_PROJECT_ID-hotel-backups/manual-backup-YYYYMMDD/* /path/to/uploads/
```

---

## 🔒 Part 5: Security Hardening for Production

### 1. Change Default Passwords

**Using Cloud SQL proxy:**
```bash
# Connect to database
cloud-sql-proxy YOUR_PROJECT_ID:us-central1:hotel-shift-log-db &

# Connect with psql
psql "host=localhost port=5432 dbname=hotel_shift_log user=hoteluser password=YOUR_SECURE_PASSWORD"

# Generate new password hashes
# Run this in Node.js REPL or create a script:
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('NEW_SECURE_PASSWORD', 12));"

# Update passwords in database
UPDATE "users" SET password = '$2a$12$HASHED_PASSWORD' WHERE username = 'admin';
UPDATE "users" SET password = '$2a$12$HASHED_PASSWORD' WHERE username = 'manager';
UPDATE "users" SET password = '$2a$12$HASHED_PASSWORD' WHERE username = 'employee';
```

### 2. Configure Cloud Armor (WAF)

```bash
# Create security policy
gcloud compute security-policies create hotel-waf-policy \
  --description "WAF for Hotel Shift Log"

# Add rate limiting rule
gcloud compute security-policies rules create 1000 \
  --security-policy hotel-waf-policy \
  --expression "true" \
  --action "rate-based-ban" \
  --rate-limit-threshold-count 100 \
  --rate-limit-threshold-interval-sec 60 \
  --ban-duration-sec 600

# Apply to Cloud Run (requires load balancer)
# See: https://cloud.google.com/armor/docs/configure-security-policies
```

### 3. Enable Cloud Monitoring and Alerts

```bash
# Create alert for high error rates
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_NOTIFICATION_CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=300s \
  --condition-display-name="Error rate > 5%" \
  --condition-filter='resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_count" AND metric.labels.response_code_class="5xx"'

# Create alert for unauthorized access attempts
# Monitor logs for repeated 401/403 responses
```

### 4. Restrict API Access

Update Cloud Run service to require authentication for sensitive endpoints:

```bash
# Deploy with IAM authentication
gcloud run services update hotel-shift-log \
  --region us-central1 \
  --ingress internal-and-cloud-load-balancing
```

### 5. Enable Audit Logging

```bash
# Enable Cloud Audit Logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=hotel-shift-log" \
  --limit 50 \
  --format json > audit.log
```

### 6. SSL/TLS Configuration

**Using Google-managed SSL (Recommended):**
```bash
# Map custom domain
gcloud run domain-mappings create \
  --service hotel-shift-log \
  --domain your-domain.com \
  --region us-central1
```

Follow the DNS verification steps provided by GCP.

---

## 🔍 Part 6: Monitoring and Maintenance

### Health Checks

The application includes built-in health endpoints:

- **API Status**: `GET /api/health` (create this endpoint for monitoring)

### Monitoring Dashboard

1. Go to [Cloud Console Monitoring](https://console.cloud.google.com/monitoring)
2. Create custom dashboard with metrics:
   - Request count and latency
   - Error rate
   - Memory and CPU usage
   - Database connections
   - File upload success/failure

### Log Analysis

```bash
# View application logs
gcloud run logs read hotel-shift-log --region=us-central1 --limit=100

# Filter for errors
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" --limit=50

# Export logs to BigQuery for analysis
gcloud logging sinks create hotel-logs-sink \
  bigquery.googleapis.com/projects/YOUR_PROJECT_ID/datasets/hotel_logs \
  --log-filter='resource.type="cloud_run_revision"'
```

### Performance Optimization

**Enable Cloud CDN:**
```bash
# Set up Cloud CDN for static assets
# Requires Cloud Load Balancer configuration
```

**Database Connection Pooling:**
Update `DATABASE_URL` with connection pool parameters:
```
postgresql://user:pass@host/db?connection_limit=5&pool_timeout=10
```

---

## 📚 Part 7: Database Schema Documentation

### Core Tables

#### Users Table
- **Purpose**: Store user accounts with role-based access
- **Fields**:
  - `id`: Unique identifier (CUID)
  - `username`: Unique login name
  - `email`: User email address (nullable)
  - `password`: Bcrypt hashed password (cost factor 12)
  - `name`: Display name
  - `role`: SUPER_ADMIN | MANAGER | EMPLOYEE
  - `isArchived`: Soft deletion flag
  - `receivesHighPriorityEmails`: Email notification opt-in
  - `createdAt`, `updatedAt`: Timestamps

#### ShiftReport Table
- **Purpose**: Main shift log entries
- **Fields**:
  - `id`: Unique identifier
  - `authorId`: User ID (nullable, preserved after user deletion)
  - `authorName`: User name snapshot
  - `priority`: NONE | LOW | MEDIUM | HIGH
  - `bodyText`: Report content
  - `notedRooms`: Array of room numbers
  - `stayoverRooms`: Array of stayover rooms
  - `arrivals`, `departures`, `occupancyPercentage`: Statistics
  - `isHidden`: Archive flag
  - `isResolved`: Resolution status
  - `createdAt`, `updatedAt`: Timestamps

#### Comment Table
- **Purpose**: Manager comments and notes on reports
- **Fields**:
  - `id`: Unique identifier
  - `shiftReportId`: Associated report
  - `authorId`, `authorName`: Author information
  - `content`: Comment text (max 400 chars)
  - `commentType`: PUBLIC | MANAGER_NOTE
  - `isHidden`: Archive flag for manager notes
  - `imageUrl`, `originalFileName`: File attachment
  - `createdAt`, `updatedAt`: Timestamps

#### Attachment Table
- **Purpose**: Files attached to shift reports
- **Fields**:
  - `filename`: Stored filename
  - `originalName`: User-provided filename
  - `mimeType`: File type
  - `size`: File size in bytes
  - `uploadPath`: Server file path

#### CommentLike Table
- **Purpose**: Track likes on comments
- **Unique constraint**: User can like each comment once

#### ReportAcknowledgement Table
- **Purpose**: Track which employees have read reports
- **Unique constraint**: User can acknowledge each report once

#### DailyPostTracker Table
- **Purpose**: Enforce daily post limits
- **Fields**: User ID, date, post count

### Relationships

```
User 1-to-many ShiftReport (author)
User 1-to-many Comment (author)
ShiftReport 1-to-many Attachment
ShiftReport 1-to-many Comment
ShiftReport 1-to-many ReportAcknowledgement
Comment 1-to-many CommentLike
```

### Indexes

Automatically created by Prisma for:
- All foreign keys
- Unique constraints
- Primary keys

**Recommended additional indexes for production:**
```sql
CREATE INDEX idx_reports_created_at ON shift_reports(created_at DESC);
CREATE INDEX idx_reports_priority ON shift_reports(priority) WHERE is_hidden = false;
CREATE INDEX idx_comments_report_type ON comments(shift_report_id, comment_type);
```

---

## 🚨 Part 8: Troubleshooting

### Common Issues

**Application won't start:**
```bash
# Check logs
gcloud run logs read hotel-shift-log --region=us-central1 --limit=100

# Verify environment variables
gcloud run services describe hotel-shift-log --region=us-central1
```

**Database connection errors:**
```bash
# Test Cloud SQL connection
gcloud sql connect hotel-shift-log-db --user=hoteluser

# Check authorized networks
gcloud sql instances describe hotel-shift-log-db
```

**Email not sending:**
1. Check SMTP credentials in Secret Manager
2. Verify email configuration in environment variables
3. Check application logs for SMTP errors
4. Test SMTP connection manually:

```bash
# Test SMTP with telnet
telnet smtp.gmail.com 587
```

**File uploads failing:**
1. Check disk space on Cloud Run
2. Verify uploads directory permissions
3. Check file size limits in application logs

### Performance Issues

**Slow database queries:**
```bash
# Enable slow query logging
gcloud sql instances patch hotel-shift-log-db \
  --database-flags log_min_duration_statement=1000

# Analyze query performance
gcloud sql operations list --instance=hotel-shift-log-db
```

**High memory usage:**
```bash
# Increase Cloud Run memory
gcloud run services update hotel-shift-log \
  --memory 2Gi \
  --region us-central1
```

---

## 📞 Support and Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Review error logs
- Check backup completion
- Monitor database size

**Monthly:**
- Review user access
- Update passwords for service accounts
- Test backup restoration
- Review security alerts

**Quarterly:**
- Update dependencies
- Security audit
- Performance review
- Disaster recovery test

### Update Deployment

```bash
# Build new image
cd /home/ubuntu/hotel_shift_log/nextjs_space
gcloud builds submit --tag us-central1-docker.pkg.dev/YOUR_PROJECT_ID/hotel-shift-log/app:v2

# Deploy with zero downtime
gcloud run services update hotel-shift-log \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/hotel-shift-log/app:v2 \
  --region us-central1
```

### Rollback Procedure

```bash
# List previous revisions
gcloud run revisions list --service=hotel-shift-log --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic hotel-shift-log \
  --to-revisions REVISION_NAME=100 \
  --region us-central1
```

---

## 📄 License

Proprietary - Internal Use Only

---

## 🔗 Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Best Practices](https://cloud.google.com/sql/docs/postgres/best-practices)
- [Next.js Production Deployment](https://nextjs.org/docs/deployment)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/performance-and-optimization/deployment)

---

**Last Updated**: October 21, 2025  
**Version**: 1.0.0  
**Deployment Target**: Google Cloud Platform
