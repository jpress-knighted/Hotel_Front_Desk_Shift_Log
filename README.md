
# Hotel Shift Log Management System

A comprehensive shift reporting and management system designed for hotel front desk operations.

## Features

### For Employees
- Create detailed shift reports with attachments (images, documents up to 30MB)
- Add multiple attachments per report (up to 3 files)
- Mark reports as different priority levels (NORMAL, HIGH, PRIORITY)
- Track shift patterns (AM, PM, NIGHT, DOUBLE)
- Acknowledge reports with "Read" status
- Daily post limit protection (25 reports/day maximum)

### For Managers
- View and search all shift reports
- Add public comments and private manager notes
- Attach files to comments (up to 30MB per file)
- Like comments from other managers
- Mark reports as resolved
- Archive/unarchive reports
- Export reports to PDF or CSV
- Receive email notifications for high-priority reports
- Comment limit: 30 per report

### For Administrators
- All manager capabilities
- User management (create, edit, archive, delete users)
- Configure email notification recipients
- Role-based access control (SUPER_ADMIN, MANAGER, EMPLOYEE)
- System-wide oversight and management

## Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js with JWT
- **UI:** React with Tailwind CSS, shadcn/ui components
- **File Storage:** Local filesystem (upgradeable to Google Cloud Storage)
- **Email:** SMTP (Gmail, SendGrid, or custom)
- **Deployment:** Google Cloud Platform (Cloud Run + Cloud SQL)

## Security Features

- BCrypt password hashing (cost factor 12)
- Role-based access control (RBAC)
- Input validation and sanitization
- Path traversal protection
- File type and size validation
- Rate limiting (ready for integration)
- Security headers (XSS, clickjacking protection)
- CSRF protection via NextAuth
- SQL injection protection via Prisma

## Project Structure

```
hotel_shift_log/
├── nextjs_space/              # Next.js application
│   ├── app/                   # App router pages and API routes
│   │   ├── api/               # API endpoints
│   │   ├── dashboard/         # Manager/Admin dashboard
│   │   ├── login/             # Login page
│   │   ├── users/             # User management
│   │   └── add-report/        # Report creation
│   ├── components/            # React components
│   ├── lib/                   # Utilities and configurations
│   │   ├── auth.ts            # Authentication config
│   │   ├── db.ts              # Database client
│   │   ├── email.ts           # Email service
│   │   ├── security.ts        # Security utilities
│   │   └── types.ts           # TypeScript types
│   ├── prisma/                # Database schema and migrations
│   └── uploads/               # File upload directory
├── Dockerfile                 # Container configuration
├── .dockerignore              # Docker ignore rules
├── .gitignore                 # Git ignore rules
├── DEPLOYMENT_GUIDE.md        # Complete deployment instructions
└── SECURITY.md                # Security documentation
```

## Quick Start (Development)

### Prerequisites
- Node.js 18+ and yarn
- PostgreSQL database
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO/nextjs_space
```

2. Install dependencies:
```bash
yarn install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/hotel_shift_log"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

4. Initialize database:
```bash
yarn prisma generate
yarn prisma db push
yarn prisma db seed
```

5. Start development server:
```bash
yarn dev
```

6. Open http://localhost:3000

### Default Accounts

| Username | Password | Role |
|----------|----------|------|
| admin | Admin123! | SUPER_ADMIN |
| manager | Manager123! | MANAGER |
| employee | Employee123! | EMPLOYEE |

**IMPORTANT:** Change these passwords before deploying to production.

## Deployment to Google Cloud Platform

For complete deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### Quick Summary

1. **Prepare:**
   - Clean database (clear test data)
   - Change default passwords
   - Push code to GitHub

2. **Set up GCP:**
   - Create Cloud SQL database (PostgreSQL)
   - Configure secrets in Secret Manager
   - Grant service account permissions

3. **Deploy:**
   - Create Cloud Run service with GitHub integration
   - Configure environment variables
   - Connect to Cloud SQL
   - Mount Google Cloud Storage for file uploads

4. **Test:**
   - Verify authentication
   - Test all user roles
   - Check email notifications
   - Validate file uploads

Estimated deployment time: 60-90 minutes
Monthly cost: $25-50 for small hotels (10-50 users)

## Database Management

### Clear Reports Data (Preserve Users)
```bash
cd nextjs_space
yarn tsx scripts/clear-reports-data.ts
```

This removes all reports, comments, and attachments while keeping user accounts intact.

### Reset Database (Full Reset)
```bash
yarn prisma migrate reset
```

This drops all data and re-seeds the database with default users.

### Database Migrations
```bash
# Generate Prisma client
yarn prisma generate

# Push schema changes
yarn prisma db push

# Create migration
yarn prisma migrate dev --name your_migration_name
```

## File Storage

### Local Storage (Default)
Files stored in `nextjs_space/uploads/` directory.

**Limitations:**
- Files lost on container restart/redeploy
- Not suitable for production with multiple instances

### Google Cloud Storage (Production)
Mount GCS bucket as volume to Cloud Run for persistent storage.

**Benefits:**
- Files persist across deployments
- Works with multiple instances
- Automatic backups and durability
- No code changes required

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) Section 7 for setup instructions.

## Email Notifications

High-priority reports trigger email notifications to configured managers.

### Configuration

1. Set up SMTP credentials (Gmail with app password recommended)
2. Configure environment variables:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASSWORD`
3. Enable email notifications for managers (in User Management)

### Gmail Setup

1. Enable 2FA on Google account
2. Generate app password: https://myaccount.google.com/apppasswords
3. Use app password in `SMTP_PASSWORD`

## Security

For detailed security information, see [SECURITY.md](./SECURITY.md)

### Key Security Features
- Secure password hashing (BCrypt)
- Role-based access control
- Input validation and sanitization
- File upload restrictions
- Rate limiting framework
- Security headers
- CSRF protection

### Security Best Practices

**Before Deployment:**
- Change all default passwords
- Generate strong NEXTAUTH_SECRET (32+ characters)
- Review user permissions
- Enable database backups

**After Deployment:**
- Configure monitoring and alerts
- Review logs regularly
- Keep dependencies updated
- Test backup and restore procedures

## Monitoring

### Application Logs
View logs in GCP Console: https://console.cloud.google.com/logs

Useful filters:
```
# Errors
resource.type="cloud_run_revision" severity>=ERROR

# Authentication issues
textPayload=~"authentication" severity>=WARNING

# File uploads
textPayload=~"upload"
```

### Uptime Monitoring
Set up uptime checks in GCP Cloud Monitoring for the `/login` endpoint.

### Performance Metrics
Monitor:
- Response times
- Error rates
- CPU and memory usage
- Database connection pool
- File storage usage

## Troubleshooting

### Common Issues

**Cannot log in:**
- Verify NEXTAUTH_URL matches your domain
- Check database connection
- Ensure user is not archived

**Files not persisting:**
- Using local storage (not recommended for production)
- Solution: Mount GCS bucket (see DEPLOYMENT_GUIDE.md)

**Email notifications not working:**
- Check SMTP credentials
- For Gmail: use app password, not regular password
- Verify manager has email notifications enabled

**Build failures:**
- Check Dockerfile is in repository root
- Verify all paths in Dockerfile are correct
- Review Cloud Build logs for specific errors

For more troubleshooting, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) Section 11.

## Maintenance

### Regular Tasks

**Daily:**
- Monitor logs for errors
- Check uptime status

**Weekly:**
- Review user activity
- Check database performance
- Verify backups are running

**Monthly:**
- Update dependencies
- Run security audit
- Review and archive old reports
- Test backup restore procedure

**Quarterly:**
- Security review
- Update documentation
- Test disaster recovery plan

### Updating Dependencies

```bash
cd nextjs_space

# Check for updates
yarn upgrade-interactive

# Run security audit
yarn audit

# Update Prisma
yarn add prisma@latest @prisma/client@latest
yarn prisma generate
```

## Contributing

This is a private application. For feature requests or bug reports, contact the system administrator.

## License

Proprietary - All rights reserved

## Support

For technical support or questions:
- Review [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for deployment issues
- Check [SECURITY.md](./SECURITY.md) for security concerns
- Contact system administrator

## Version History

**Version 1.0** - October 2025
- Initial production release
- Core shift reporting functionality
- User management
- Email notifications
- File attachments
- Export capabilities
- Google Cloud Platform deployment

---

**Last Updated:** October 23, 2025
