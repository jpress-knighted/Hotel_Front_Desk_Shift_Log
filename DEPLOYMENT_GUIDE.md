
# Hotel Shift Log - Complete Deployment Guide

## Table of Contents
1. Overview
2. Prerequisites
3. Pre-Deployment Preparation
4. Database Setup
5. Secret Configuration
6. Cloud Run Deployment
7. File Storage Configuration
8. Security Hardening
9. Post-Deployment Testing
10. Monitoring and Maintenance
11. Troubleshooting

---

## 1. Overview

This guide covers deploying the Hotel Shift Log application to Google Cloud Platform using Cloud Run with continuous deployment from GitHub.

**Architecture:**
- Frontend/Backend: Next.js 14 (App Router)
- Database: Cloud SQL (PostgreSQL)
- File Storage: Google Cloud Storage with FUSE mount
- Compute: Cloud Run (2nd generation)
- CI/CD: Cloud Build with GitHub integration
- Secrets: Secret Manager

**Estimated Setup Time:** 60-90 minutes
**Monthly Cost Estimate:** $25-50 for small hotel (10-50 users)

---

## 2. Prerequisites

**Required:**
- Google Cloud Platform account with billing enabled
- GitHub account with repository access
- Git installed locally
- Domain name (optional, for custom domain)

**GCP APIs to Enable:**
1. Cloud Run API
2. Cloud SQL Admin API
3. Secret Manager API
4. Cloud Build API
5. Cloud Storage API

Enable via: https://console.cloud.google.com/apis/library

---

## 3. Pre-Deployment Preparation

### 3.1 Clean Database

Run the data cleanup script to remove all test data while preserving user accounts:

```bash
cd nextjs_space
yarn install
yarn tsx scripts/clear-reports-data.ts
```

This removes:
- All shift reports
- All comments and attachments
- Daily post tracking data
- Uploaded files metadata

This preserves:
- User accounts (admin, manager, employee)
- Database schema

### 3.2 Clear Uploaded Files

```bash
cd nextjs_space/uploads
rm -rf *
cd comments
rm -rf *
```

### 3.3 Change Default Passwords

CRITICAL: Change these passwords before deployment:

**Default Accounts:**
- Username: `admin` / Password: `Admin123!` (SUPER_ADMIN)
- Username: `manager` / Password: `Manager123!` (MANAGER)
- Username: `employee` / Password: `Employee123!` (EMPLOYEE)

**To change passwords after deployment:**

```bash
# Generate password hash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('NEW_PASSWORD', 12));"

# Update in database
UPDATE users SET password = '$2a$12$HASH...' WHERE username = 'admin';
```

### 3.4 Push Code to GitHub

```bash
cd /path/to/your/project
git init
git add .
git commit -m "Initial commit - Production ready"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

**Important:** Ensure `.gitignore` excludes:
- `.env`
- `.env.local`
- `node_modules/`
- `uploads/`
- `.logs/`

---

## 4. Database Setup

### 4.1 Create Cloud SQL Instance

Navigate to: https://console.cloud.google.com/sql

1. Click **Create Instance**
2. Choose **PostgreSQL**
3. Configure:
   - Instance ID: `hotel-shift-log-db`
   - Password: Generate strong password (save securely)
   - Database version: PostgreSQL 14
   - Region: Choose closest to users (e.g., `us-central1`)
   - Machine type: **Shared Core** - 1 vCPU, 1.7 GB RAM
   - Storage: 10 GB SSD (auto-increase enabled)

4. Expand **Show Configuration Options**:

   **Connections:**
   - Uncheck "Public IP"
   - Check "Private IP" (recommended for security)

   **Backups:**
   - Enable automated backups (default: daily at 2 AM)
   - Retain backups for 30 days

   **Maintenance:**
   - Enable automatic updates
   - Set maintenance window to low-traffic period

5. Click **Create** (takes 5-10 minutes)

### 4.2 Create Database

After instance creation:

1. Go to **Databases** tab
2. Click **Create Database**
3. Name: `hotel_shift_log`
4. Click **Create**

### 4.3 Note Connection Details

Go to **Overview** tab and copy:
- **Connection name**: `PROJECT_ID:REGION:INSTANCE_NAME`
- Example: `my-project-12345:us-central1:hotel-shift-log-db`

---

## 5. Secret Configuration

### 5.1 Enable Secret Manager API

Navigate to: https://console.cloud.google.com/security/secret-manager

Click **Enable API** if prompted.

### 5.2 Create Secrets

Create three secrets with the following values:

**Secret 1: nextauth-secret**
1. Click **Create Secret**
2. Name: `nextauth-secret`
3. Secret value: Generate with:
   ```bash
   openssl rand -base64 32
   ```
4. Click **Create**

**Secret 2: smtp-password**
1. Click **Create Secret**
2. Name: `smtp-password`
3. For Gmail:
   - Enable 2FA on your Google account
   - Go to: https://myaccount.google.com/apppasswords
   - Generate app password for "Mail"
   - Copy the 16-character password
4. Paste into Secret value
5. Click **Create**

**Secret 3: database-url**
1. Click **Create Secret**
2. Name: `database-url`
3. Secret value format:
   ```
   postgresql://postgres:YOUR_DB_PASSWORD@/hotel_shift_log?host=/cloudsql/YOUR_CONNECTION_NAME
   ```
   Replace:
   - `YOUR_DB_PASSWORD`: Password from Step 4.1
   - `YOUR_CONNECTION_NAME`: Connection name from Step 4.3

4. Example:
   ```
   postgresql://postgres:MySecurePass123@/hotel_shift_log?host=/cloudsql/my-project:us-central1:hotel-shift-log-db
   ```
5. Click **Create**

### 5.3 Grant Permissions (CRITICAL)

The Cloud Run service account needs permission to read these secrets.

Navigate to: https://console.cloud.google.com/iam-admin/iam

**Option A: Project-Level Access (Recommended - Simpler)**

1. Find service account: `PROJECT_NUMBER-compute@developer.gserviceaccount.com`
   - To find PROJECT_NUMBER: Click project dropdown at top, number shown next to name
2. Click pencil icon (Edit)
3. Click **Add Another Role**
4. Select: **Secret Manager Secret Accessor**
5. Click **Save**

**Option B: Per-Secret Access (More Secure)**

For each secret (`nextauth-secret`, `smtp-password`, `database-url`):

1. Go to Secret Manager
2. Click secret name
3. Click **Permissions** tab
4. Click **Grant Access**
5. New principals: `PROJECT_NUMBER-compute@developer.gserviceaccount.com`
6. Role: **Secret Manager Secret Accessor**
7. Click **Save**

WITHOUT THIS STEP: Deployment will fail with "Permission denied on secret" errors.

---

## 6. Cloud Run Deployment

### 6.1 Create Cloud Run Service

Navigate to: https://console.cloud.google.com/run

1. Click **Create Service**

2. Choose deployment method:
   - Select: **Continuously deploy from a repository (source-based)**
   - Click **Set Up with Cloud Build**

3. Configure source:
   - **Repository provider**: GitHub
   - Click **Authenticate with GitHub**
   - Authorize Cloud Build
   - Select repository: `YOUR_USERNAME/YOUR_REPO`
   - Branch: `main` (or `master`)
   - **Build type**: Dockerfile
   - **Dockerfile location**: `/Dockerfile` (in repo root)
   - Click **Save**

4. Configure service settings:
   - **Service name**: `hotel-shift-log`
   - **Region**: Same as Cloud SQL (e.g., `us-central1`)
   - **Authentication**: Allow unauthenticated invocations
   - **Execution environment**: Second generation (REQUIRED for volumes)

5. Configure resources:
   - **CPU**: 2 vCPU
   - **Memory**: 2 GiB
   - **Request timeout**: 300 seconds (5 minutes)
   - **Maximum concurrent requests per instance**: 80

6. Configure autoscaling:
   - **Minimum instances**: 1 (prevents cold starts)
   - **Maximum instances**: 10

7. Click **Container, Volumes, Networking, Security**

### 6.2 Configure Environment Variables

Click **Variables & Secrets** tab, then **Variables**:

Add these environment variables:

| Name | Value |
|------|-------|
| `NEXTAUTH_URL` | Leave empty for now, will update after first deployment |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `your-email@gmail.com` |

### 6.3 Reference Secrets

Click **Secrets** tab:

1. Click **Reference a Secret**
   - Secret: `nextauth-secret`
   - Expose as environment variable: `NEXTAUTH_SECRET`
   - Click **Done**

2. Click **Reference a Secret**
   - Secret: `smtp-password`
   - Expose as environment variable: `SMTP_PASSWORD`
   - Click **Done**

3. Click **Reference a Secret**
   - Secret: `database-url`
   - Expose as environment variable: `DATABASE_URL`
   - Click **Done**

### 6.4 Connect to Cloud SQL

Click **Connections** tab:

1. Click **Add Connection**
2. Select: `hotel-shift-log-db`
3. Click **Done**

### 6.5 Deploy

1. Review all settings
2. Click **Create**
3. Wait for build (5-10 minutes)
4. Monitor progress in Cloud Build console

### 6.6 Update NEXTAUTH_URL

After successful deployment:

1. Copy the Cloud Run URL (e.g., `https://hotel-shift-log-abc123.run.app`)
2. Click **Edit & Deploy New Revision**
3. Go to Variables tab
4. Update `NEXTAUTH_URL` to the Cloud Run URL
5. Click **Deploy**

---

## 7. File Storage Configuration

By default, uploaded files are stored in the container's filesystem, which is ephemeral. For production, use Google Cloud Storage.

### 7.1 Create Storage Bucket

Navigate to: https://console.cloud.google.com/storage

1. Click **Create Bucket**
2. Name: `hotel-shift-log-uploads-YOUR-PROJECT-ID`
   - Must be globally unique
3. Location type: **Region**
4. Region: Same as Cloud Run (e.g., `us-central1`)
5. Storage class: **Standard**
6. Access control: **Uniform**
7. Soft delete: 7 days (default)
8. Click **Create**

### 7.2 Grant Bucket Permissions

1. Click on bucket name
2. Click **Permissions** tab
3. Click **Grant Access**
4. New principals: `PROJECT_NUMBER-compute@developer.gserviceaccount.com`
5. Role: **Storage Object Admin**
6. Click **Save**

### 7.3 Mount Bucket to Cloud Run

Navigate to: https://console.cloud.google.com/run

1. Click service: `hotel-shift-log`
2. Click **Edit & Deploy New Revision**
3. Click **Container, Volumes, Networking, Security**
4. Click **Volumes** tab
5. Click **Add Volume**

Configure volume:
- **Volume type**: Cloud Storage bucket
- **Name**: `uploads`
- **Bucket**: Select your bucket
- **Mount as read-only**: UNCHECKED
- Click **Mount**

6. Configure mount path:
   - **Mount path**: `/app/nextjs_space/uploads`
   - This is where the app expects the uploads folder

7. Verify execution environment is **Second generation** (in Container tab)

8. Click **Deploy**

### 7.4 Verify File Persistence

After deployment:

1. Log in to app
2. Upload a file in a shift report
3. Verify file appears in GCS bucket
4. Redeploy service (Edit & Deploy, no changes, just Deploy)
5. Verify file is still accessible after redeploy

---

## 8. Security Hardening

### 8.1 Change Default Passwords

CRITICAL: Change all three default account passwords immediately after deployment.

1. Log in as admin
2. Go to Users page
3. Change passwords for:
   - admin
   - manager
   - employee

### 8.2 Configure Security Headers

Already implemented in code:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: Restricted APIs

### 8.3 Enable Cloud Armor (Optional but Recommended)

For DDoS protection and WAF:

Navigate to: https://console.cloud.google.com/net-security/securitypolicies

1. Create security policy
2. Add rules:
   - Rate limiting (e.g., 100 requests per minute per IP)
   - Geo-blocking (if needed)
   - OWASP ModSecurity Core Rule Set
3. Attach policy to Cloud Run service

### 8.4 Set Up Monitoring

Navigate to: https://console.cloud.google.com/monitoring

**Create Uptime Check:**
1. Go to Uptime checks
2. Click **Create Uptime Check**
3. Configure:
   - Title: `Hotel Shift Log - Health Check`
   - Protocol: HTTPS
   - Resource type: URL
   - Hostname: Your Cloud Run URL
   - Path: `/api/health` (create this endpoint) or `/login`
4. Click **Create**

**Create Alert Policy:**
1. Go to Alerting
2. Click **Create Policy**
3. Add conditions:
   - Uptime check failed
   - Error rate > 5%
   - Response time > 3 seconds
4. Add notification channel (email)
5. Click **Save**

### 8.5 Review IAM Permissions

Navigate to: https://console.cloud.google.com/iam-admin/iam

Review all service accounts and remove unnecessary permissions. Follow principle of least privilege.

---

## 9. Post-Deployment Testing

### 9.1 Authentication Tests

- [ ] Log in as admin
- [ ] Log in as manager
- [ ] Log in as employee
- [ ] Verify archived users cannot log in
- [ ] Test logout functionality

### 9.2 Functional Tests

**As Employee:**
- [ ] Create shift report without attachments
- [ ] Create shift report with image attachment
- [ ] Create shift report with document attachment
- [ ] Verify daily post limit (try creating 26 reports)
- [ ] Click "Read" button on report

**As Manager:**
- [ ] View all reports
- [ ] Add public comment
- [ ] Add private manager note
- [ ] Add comment with attachment
- [ ] Verify comment limit (try adding 31 comments to one report)
- [ ] Like another manager's comment
- [ ] Mark report as resolved
- [ ] Archive report
- [ ] Unarchive report
- [ ] Export report as PDF
- [ ] Export reports as CSV

**As Admin:**
- [ ] All manager capabilities
- [ ] Create new user
- [ ] Edit user role
- [ ] Archive user
- [ ] Delete user
- [ ] Configure high-priority email notifications

### 9.3 Security Tests

- [ ] Try accessing /dashboard without login (should redirect to /login)
- [ ] Try accessing another user's files via direct URL (should fail)
- [ ] Try uploading executable file (.exe, .sh) (should be rejected)
- [ ] Try uploading file > 30MB (should be rejected)
- [ ] Try path traversal: `../../etc/passwd` in file names (should be sanitized)
- [ ] Verify archived users cannot log in
- [ ] Verify manager cannot create super admin

### 9.4 Performance Tests

- [ ] Page load time < 3 seconds
- [ ] File upload (10MB) completes in < 30 seconds
- [ ] Report search/filter responds in < 1 second
- [ ] PDF export (50 reports) completes in < 10 seconds
- [ ] CSV export (100 reports) completes in < 5 seconds

### 9.5 Email Tests

1. Configure a manager to receive high-priority emails:
   - Log in as admin
   - Go to Users
   - Edit manager account
   - Toggle "Receives High Priority Emails" to ON
   - Save

2. Create high-priority report:
   - Log in as employee
   - Create report with PRIORITY level
   - Verify manager receives email

3. Check email content:
   - Subject includes "HIGH PRIORITY"
   - Body includes report details
   - Link to view report works

---

## 10. Monitoring and Maintenance

### 10.1 Regular Monitoring

**Daily:**
- Check Cloud Logging for errors
  - Navigate to: https://console.cloud.google.com/logs
  - Filter: `resource.type="cloud_run_revision" severity>=ERROR`
- Review uptime check status

**Weekly:**
- Review Cloud SQL performance metrics
- Check storage usage (GCS bucket size)
- Review active user list
- Check for failed login attempts

**Monthly:**
- Review billing and costs
- Update dependencies (`yarn upgrade`)
- Run security audit (`yarn audit`)
- Test backup restore procedure
- Review user access and remove inactive users

**Quarterly:**
- Conduct security review
- Update documentation
- Test disaster recovery plan
- Review and update passwords

### 10.2 Database Backups

Cloud SQL automatically backs up your database daily.

**To restore from backup:**

1. Navigate to: https://console.cloud.google.com/sql
2. Click instance: `hotel-shift-log-db`
3. Go to **Backups** tab
4. Click on backup date
5. Click **Restore**
6. Choose **Restore to same instance** or **Restore to new instance**
7. Confirm

**Create manual backup before major changes:**
- Backups tab → **Create Backup**

### 10.3 Continuous Deployment

Push code changes to GitHub to trigger automatic redeployment:

```bash
git add .
git commit -m "Description of changes"
git push origin main
```

Cloud Build automatically:
1. Detects push
2. Builds Docker image
3. Deploys to Cloud Run
4. Zero downtime deployment

Monitor builds: https://console.cloud.google.com/cloud-build/builds

### 10.4 Scaling

Cloud Run automatically scales based on traffic:
- Min instances: 1 (configured to prevent cold starts)
- Max instances: 10
- Automatically scales between 1-10 based on request volume

To adjust:
1. Edit Cloud Run service
2. Update min/max instances
3. Deploy

### 10.5 Log Management

**View application logs:**

Navigate to: https://console.cloud.google.com/logs

Useful filters:
```
# All errors
resource.type="cloud_run_revision"
severity>=ERROR

# Authentication failures
resource.type="cloud_run_revision"
textPayload=~"authentication failed"

# File upload errors
resource.type="cloud_run_revision"
textPayload=~"upload"
severity>=WARNING

# Database errors
resource.type="cloud_run_revision"
textPayload=~"prisma"
severity>=ERROR
```

**Export logs for long-term retention:**
1. Create log sink
2. Export to Cloud Storage bucket
3. Retain for compliance period

---

## 11. Troubleshooting

### 11.1 Deployment Failures

**Symptom:** Cloud Build fails

**Check:**
1. Cloud Build logs: https://console.cloud.google.com/cloud-build/builds
2. Look for errors in build steps
3. Common issues:
   - Missing Dockerfile in repo root
   - Incorrect Dockerfile paths
   - Build timeout (increase in Cloud Build settings)
   - Insufficient permissions

**Solutions:**
- Verify Dockerfile is in repository root
- Check Dockerfile references correct paths (`hotel_shift_log/nextjs_space/`)
- Ensure all dependencies in package.json
- Increase build timeout in Cloud Build settings

### 11.2 Runtime Errors

**Symptom:** App deployed but showing errors

**Check:**
1. Cloud Run logs: Click service → Logs tab
2. Look for startup errors
3. Check environment variables are set correctly
4. Verify secrets are accessible

**Common Issues:**

**"Permission denied on secret"**
- Solution: Grant Secret Manager Secret Accessor role to service account (see Section 5.3)

**"Database connection failed"**
- Solution: Verify Cloud SQL connection is configured in Cloud Run
- Check DATABASE_URL format is correct
- Verify database exists

**"NEXTAUTH_URL not set"**
- Solution: Set NEXTAUTH_URL to your Cloud Run URL (see Section 6.6)

**"SMTP error"**
- Solution: Verify SMTP credentials, enable 2FA and app password for Gmail

### 11.3 File Upload Issues

**Symptom:** Files upload but disappear after redeploy

**Cause:** Not using GCS volume mount (files stored in ephemeral container)

**Solution:** Follow Section 7 to mount GCS bucket

**Symptom:** "Permission denied" when uploading files

**Cause:** Service account lacks Storage Object Admin role

**Solution:** Grant permissions (see Section 7.2)

**Symptom:** Files not appearing in GCS bucket

**Check:**
1. Verify volume is mounted at correct path: `/app/nextjs_space/uploads`
2. Check execution environment is "Second generation"
3. Review Cloud Run logs for file system errors

### 11.4 Authentication Issues

**Symptom:** Cannot log in

**Check:**
1. Verify NEXTAUTH_URL matches actual Cloud Run URL
2. Check NEXTAUTH_SECRET is set
3. Look for auth errors in logs

**Solution:**
- Ensure NEXTAUTH_URL does NOT have trailing slash
- Verify database connection is working
- Check user is not archived

**Symptom:** "Invalid credentials" for correct password

**Cause:** Password may have been changed or database not seeded

**Solution:**
- Log in to Cloud SQL via console
- Reset password manually:
  ```sql
  UPDATE users SET password = '$2a$12$HASH' WHERE username = 'admin';
  ```

### 11.5 Performance Issues

**Symptom:** Slow response times

**Check:**
1. Cloud Run metrics (CPU, memory usage)
2. Cloud SQL metrics (CPU, connections)
3. Check for slow database queries in logs

**Solutions:**
- Increase Cloud Run memory/CPU
- Increase Cloud SQL machine type
- Add database indexes for frequently queried fields
- Increase max instances if hitting concurrency limits

**Symptom:** Cold start delays

**Solution:** Ensure min instances is set to 1 (see Section 6.1)

### 11.6 Email Notification Issues

**Symptom:** High-priority emails not sent

**Check:**
1. SMTP settings are correct
2. Manager has "Receives High Priority Emails" enabled
3. Manager has valid email address
4. Check logs for SMTP errors

**Solutions:**
- Verify SMTP credentials in Secret Manager
- For Gmail: Use app password, not regular password
- Check firewall allows outbound SMTP (port 587)
- Test SMTP connection manually

### 11.7 Database Issues

**Symptom:** "Too many connections"

**Solution:**
- Increase connection pool size in DATABASE_URL
- Increase Cloud SQL max connections setting
- Check for connection leaks in code

**Symptom:** Database full

**Solution:**
- Enable auto-increase for storage (should be on by default)
- Manually increase storage in Cloud SQL settings
- Clean up old data if needed

### 11.8 Getting Help

**GCP Support:**
- Console: https://console.cloud.google.com/support
- Documentation: https://cloud.google.com/docs

**Application Logs:**
- Always include logs when troubleshooting
- Redact any sensitive information before sharing

**Common Log Locations:**
- Cloud Run: Service → Logs tab
- Cloud SQL: Instance → Logs tab
- Cloud Build: Build History → Build details

---

## Appendix A: Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://postgres:pass@/db?host=/cloudsql/project:region:instance` |
| `NEXTAUTH_URL` | Yes | Public URL of application | `https://hotel-shift-log-abc123.run.app` |
| `NEXTAUTH_SECRET` | Yes | Secret for JWT signing | `openssl rand -base64 32` |
| `SMTP_HOST` | Yes | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | Yes | SMTP server port | `587` |
| `SMTP_USER` | Yes | SMTP username/email | `your-email@gmail.com` |
| `SMTP_PASSWORD` | Yes | SMTP password/app password | Gmail app password |
| `NODE_ENV` | Auto | Environment (production/development) | Set by Cloud Run |

---

## Appendix B: Security Checklist

**Before Deployment:**
- [ ] All default passwords changed
- [ ] Strong NEXTAUTH_SECRET generated (32+ characters)
- [ ] SMTP credentials secured in Secret Manager
- [ ] .env file excluded from Git
- [ ] No sensitive data in code
- [ ] Dependencies audited (yarn audit)

**After Deployment:**
- [ ] HTTPS enabled (automatic with Cloud Run)
- [ ] Custom domain configured with SSL
- [ ] Uptime monitoring configured
- [ ] Error alerting configured
- [ ] Database backups verified
- [ ] Incident response plan documented
- [ ] Security headers verified in browser dev tools

**Ongoing:**
- [ ] Weekly log reviews for suspicious activity
- [ ] Monthly dependency updates
- [ ] Quarterly security audits
- [ ] Annual penetration testing (for high-security requirements)

---

## Appendix C: Cost Optimization

**Ways to reduce costs:**

1. **Use Shared Core Cloud SQL:** Saves ~50% vs dedicated CPU
2. **Set min instances to 0:** Saves $10-15/month but adds cold start latency
3. **Use lower-tier Cloud SQL:** Start small, scale as needed
4. **Enable Cloud SQL automatic storage increase:** Prevents over-provisioning
5. **Use lifecycle policies on GCS:** Delete old files automatically
6. **Monitor with cost alerts:** Set budget alerts in GCP console

**Budget alerts:**
1. Navigate to: https://console.cloud.google.com/billing/budgets
2. Click **Create Budget**
3. Set threshold: $50/month (adjust for your needs)
4. Add email notifications at 50%, 90%, 100%

---

## Appendix D: Custom Domain Setup

**Prerequisites:**
- Own a domain name
- Access to domain DNS settings

**Steps:**

1. Navigate to: https://console.cloud.google.com/run
2. Click service: `hotel-shift-log`
3. Click **Manage Custom Domains**
4. Click **Add Mapping**
5. Select service
6. Enter domain: `shifts.yourhotel.com`
7. Follow DNS verification:
   - Add CNAME record to DNS:
     ```
     shifts.yourhotel.com CNAME ghs.googlehosted.com
     ```
   - Verification can take up to 24 hours
8. Cloud Run automatically provisions SSL certificate
9. Update NEXTAUTH_URL environment variable to custom domain
10. Redeploy

---

## Document Information

**Version:** 1.0
**Last Updated:** October 23, 2025
**Next Review:** January 23, 2026
**Maintained By:** System Administrator

