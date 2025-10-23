
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

## 🚀 Google Cloud Platform Deployment Guide

### Prerequisites

- Google Cloud account with billing enabled
- `gcloud` CLI installed and configured
- Domain name (optional but recommended)

### Architecture Overview

```
Google Cloud Platform
├── Cloud SQL (PostgreSQL) - Database
├── Cloud Run - Application hosting
├── Cloud Storage - File uploads and backups
├── Cloud Scheduler - Automated backups
├── Secret Manager - Environment variables
└── Cloud Monitoring - Logging and alerts
```

---

## 📦 Part 1: Database Setup (Cloud SQL)

### Step 1: Create PostgreSQL Instance

```bash
# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Create Cloud SQL instance (customize as needed)
gcloud sql instances create hotel-shift-log-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=TEMPORARY_SECURE_PASSWORD \
  --storage-size=10GB \
  --storage-type=SSD \
  --backup-start-time=02:00 \
  --enable-bin-log \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=3
```

**Production recommendations:**
- Use `db-custom-2-4096` or higher tier for production
- Enable high availability with `--availability-type=REGIONAL`
- Increase storage size based on expected data volume

### Step 2: Create Database and User

```bash
# Create the database
gcloud sql databases create hotel_shift_log \
  --instance=hotel-shift-log-db

# Create application user
gcloud sql users create hoteluser \
  --instance=hotel-shift-log-db \
  --password=YOUR_SECURE_PASSWORD
```

### Step 3: Configure Network Access

```bash
# Allow Cloud Run to access Cloud SQL (automatic connection)
# No additional firewall rules needed for Cloud Run

# For external management access (optional, use with caution):
gcloud sql instances patch hotel-shift-log-db \
  --authorized-networks=YOUR_IP_ADDRESS/32
```

### Step 4: Get Connection Details

```bash
# Get the connection name
gcloud sql instances describe hotel-shift-log-db \
  --format="value(connectionName)"

# Example output: YOUR_PROJECT_ID:us-central1:hotel-shift-log-db
```

Save this connection name - you'll need it for Cloud Run.

---

## 🌐 Part 2: Application Deployment (Cloud Run)

### Step 1: Prepare Application for Deployment

In your `nextjs_space` directory, create a production `Dockerfile`:

```dockerfile
# /home/ubuntu/hotel_shift_log/nextjs_space/Dockerfile
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install dependencies
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile --production=false

# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
RUN yarn build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create uploads directory with correct permissions
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Step 2: Configure Environment Variables in Secret Manager

```bash
# Create secrets for sensitive data
echo -n "YOUR_NEXTAUTH_SECRET" | gcloud secrets create nextauth-secret --data-file=-
echo -n "YOUR_SMTP_PASSWORD" | gcloud secrets create smtp-password --data-file=-

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding nextauth-secret \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding smtp-password \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 3: Build and Push Docker Image

```bash
# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Create Artifact Registry repository
gcloud artifacts repositories create hotel-shift-log \
  --repository-format=docker \
  --location=us-central1

# Build and push image (from nextjs_space directory)
cd /home/ubuntu/hotel_shift_log/nextjs_space

gcloud builds submit \
  --tag us-central1-docker.pkg.dev/YOUR_PROJECT_ID/hotel-shift-log/app:latest
```

### Step 4: Deploy to Cloud Run

```bash
# Deploy with Cloud SQL connection
gcloud run deploy hotel-shift-log \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/hotel-shift-log/app:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 10 \
  --add-cloudsql-instances YOUR_PROJECT_ID:us-central1:hotel-shift-log-db \
  --set-env-vars "DATABASE_URL=postgresql://hoteluser:YOUR_SECURE_PASSWORD@/hotel_shift_log?host=/cloudsql/YOUR_PROJECT_ID:us-central1:hotel-shift-log-db" \
  --set-secrets "NEXTAUTH_SECRET=nextauth-secret:latest,SMTP_PASSWORD=smtp-password:latest" \
  --set-env-vars "NEXTAUTH_URL=https://YOUR_DOMAIN.com,SMTP_HOST=smtp.gmail.com,SMTP_PORT=587,SMTP_USER=your-email@gmail.com"
```

### Step 5: Run Database Migrations

```bash
# Get Cloud Run service URL
SERVICE_URL=$(gcloud run services describe hotel-shift-log --region=us-central1 --format="value(status.url)")

# Connect to Cloud SQL proxy locally for migrations
cloud-sql-proxy YOUR_PROJECT_ID:us-central1:hotel-shift-log-db &

# Set DATABASE_URL for local migrations
export DATABASE_URL="postgresql://hoteluser:YOUR_SECURE_PASSWORD@localhost:5432/hotel_shift_log"

# Run migrations
cd /home/ubuntu/hotel_shift_log/nextjs_space
npx prisma db push

# Seed initial users
npx prisma db seed

# Stop Cloud SQL proxy
kill %1
```

---

## 📧 Part 3: Email Configuration

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
