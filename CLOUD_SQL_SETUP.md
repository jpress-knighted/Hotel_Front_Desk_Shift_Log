
# Google Cloud SQL Setup Guide

This guide explains how to properly configure your Hotel Shift Log application to work with Google Cloud SQL.

## Prerequisites

- Google Cloud Platform account
- Cloud SQL instance created
- Cloud Run service created

## Step 1: Locate Your Cloud SQL Connection Details

1. Go to **Google Cloud Console** → **Cloud SQL**
2. Click on your PostgreSQL instance
3. Note down the **Connection name** (format: `PROJECT_ID:REGION:INSTANCE_NAME`)
   - Example: `houston-front-desk-shift-logs:us-central1:hotel-shift-log-db`
4. Note your database credentials:
   - **Username** (usually `postgres`)
   - **Password** (the one you set during creation)
   - **Database name** (e.g., `hotel_shift_log`)

## Step 2: Format Your DATABASE_URL

The connection string must follow this exact format for Cloud Run with Cloud SQL:

```
postgresql://USERNAME:PASSWORD@localhost/DATABASE_NAME?host=/cloudsql/CONNECTION_NAME
```

### Example:
```
postgresql://postgres:mySecurePassword123@localhost/hotel_shift_log?host=/cloudsql/houston-front-desk-shift-logs:us-central1:hotel-shift-log-db
```

### Important Notes:
- ✅ Must include `@localhost` after the password
- ✅ Use `/cloudsql/` prefix for the connection name
- ✅ No spaces in the connection string
- ❌ Don't use `@/database` - this will cause "empty host" error

## Step 3: Update Secret in Secret Manager

1. Go to **Google Cloud Console** → **Secret Manager**
2. Click on the **`database-url`** secret
3. Click **"+ NEW VERSION"**
4. Paste your formatted connection string
5. Click **"ADD NEW VERSION"**

## Step 4: Configure Cloud Run to Connect to Cloud SQL

1. Go to **Cloud Run** → Select your service
2. Click **"Edit & Deploy New Revision"**
3. Go to the **"Connections"** tab
4. Under **"Cloud SQL connections"**:
   - Click **"Add Connection"**
   - Select your Cloud SQL instance from the dropdown
   - The instance should match your connection name
5. Click **"Deploy"**

## Step 5: Verify Database Setup

### Check if Database Exists

Connect to your Cloud SQL instance using Cloud Shell:

```bash
gcloud sql connect YOUR_INSTANCE_NAME --user=postgres
```

Then in the PostgreSQL prompt:

```sql
-- List all databases
\l

-- If hotel_shift_log doesn't exist, create it
CREATE DATABASE hotel_shift_log;

-- Connect to it
\c hotel_shift_log

-- Check if tables exist
\dt
```

### Run Migrations (if needed)

The application automatically runs migrations on startup via the `startup.sh` script. However, you can also run them manually:

```bash
# From Cloud Shell or local with Cloud SQL Proxy
cd nextjs_space
yarn prisma migrate deploy
```

## Step 6: Create Initial Super Admin User

After your first deployment with the correct database connection:

1. Open your browser's Developer Console (F12)
2. Go to the **Console** tab
3. Run this command to create the first super admin:

```javascript
fetch('/api/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'jpress',
    email: 'jpress@hotel.com',
    password: 'password123',
    name: 'J Press',
    role: 'SUPER_ADMIN'
  })
}).then(r => r.json()).then(console.log)
```

**⚠️ IMPORTANT:** Change this password immediately after first login!

## Troubleshooting

### Error: "empty host in database URL"

**Cause:** Missing `@localhost` in connection string

**Fix:** Update your DATABASE_URL to include `@localhost`:
```
postgresql://user:pass@localhost/db?host=/cloudsql/...
```

### Error: "Can't reach database server"

**Possible causes:**
1. Cloud SQL connection not configured in Cloud Run
2. Wrong connection name
3. Cloud SQL instance stopped or deleted

**Fix:**
- Verify Cloud SQL connection in Cloud Run → Connections tab
- Check connection name matches exactly (including region)
- Verify Cloud SQL instance is running

### Error: "password authentication failed"

**Cause:** Wrong database password

**Fix:** Update the password in your DATABASE_URL secret

### Error: "database does not exist"

**Cause:** Database not created in Cloud SQL instance

**Fix:** Connect to Cloud SQL and create the database:
```sql
CREATE DATABASE hotel_shift_log;
```

### Error: "relation 'User' does not exist"

**Cause:** Migrations haven't run

**Fix:** Check Cloud Run logs for migration errors. The startup script should automatically run migrations. If not, run manually:
```bash
yarn prisma migrate deploy
```

## Security Best Practices

1. **Use Secret Manager** for DATABASE_URL (never commit to git)
2. **Strong passwords** for database users
3. **Restrict access** - only allow connections from Cloud Run
4. **Enable SSL** for database connections (default in Cloud SQL)
5. **Regular backups** - Cloud SQL does this automatically
6. **Monitor logs** - Check Cloud Run and Cloud SQL logs regularly

## Cost Optimization

1. **Right-size your instance** - Start with `db-f1-micro` for small hotels
2. **Enable automatic storage increase** - Prevents downtime
3. **Set up deletion protection** - Prevents accidental deletion
4. **Use automated backups** - Free up to 7 days of backups
5. **Stop development instances** when not in use

## Connection String Reference

### Format for Cloud Run + Cloud SQL (Unix Socket)
```
postgresql://USERNAME:PASSWORD@localhost/DATABASE?host=/cloudsql/PROJECT:REGION:INSTANCE
```

### Format for TCP Connection (with Cloud SQL Proxy)
```
postgresql://USERNAME:PASSWORD@127.0.0.1:5432/DATABASE
```

### Format for Public IP (not recommended)
```
postgresql://USERNAME:PASSWORD@PUBLIC_IP:5432/DATABASE
```

## Next Steps

1. ✅ Configure DATABASE_URL secret
2. ✅ Enable Cloud SQL connection in Cloud Run
3. ✅ Deploy application
4. ✅ Create first super admin user
5. ✅ Change default passwords
6. ✅ Test all functionality
7. ✅ Configure email notifications (optional)
8. ✅ Set up Google Cloud Storage for file uploads (recommended)

For complete deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
