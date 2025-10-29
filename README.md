
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
