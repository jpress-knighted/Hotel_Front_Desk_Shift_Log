
# Migration Data Directory

This directory contains all scripts and exported data for migrating from Abacus.AI to Google Cloud SQL.

## 📁 Directory Contents

```
migration_data/
├── README.md                          (this file)
├── package.json                       (dependencies for scripts)
├── export_from_abacusai.js           (export script)
├── import_to_cloudsql.js             (import script)
├── test_cloudsql_connection.js       (connection test)
├── setup_schema.sh                    (schema setup script)
├── abacusai_data_export.json         (✅ COMPLETE EXPORT)
├── users.json                         (✅ 4 users exported)
└── ... (other table files)
```

## ✅ Migration Status

### Completed Steps:

1. ✅ **Data Export** - Successfully exported from Abacus.AI database
   - 4 users exported
   - All data saved to JSON files

### Next Steps:

2. **Schema Setup** - Create database schema in Cloud SQL
3. **Data Import** - Import exported data into Cloud SQL
4. **Testing** - Verify migration success
5. **Deployment** - Update Cloud Run with new database

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
cd /home/ubuntu/hotel_shift_log/migration_data
npm install
```

### Option A: Automated Migration (Recommended)

Run the complete migration in order:

```bash
# 1. Export data (✅ Already completed!)
npm run export

# 2. Setup schema in Cloud SQL
cd /home/ubuntu/hotel_shift_log
./migration_data/setup_schema.sh

# 3. Import data
cd migration_data
npm run import

# 4. Test connection
npm run test
```

### Option B: Manual Steps

Follow the detailed guide: [CLOUD_SQL_MIGRATION_GUIDE.md](../CLOUD_SQL_MIGRATION_GUIDE.md)

## 📊 Exported Data Summary

| Table | Rows Exported | Status |
|-------|---------------|--------|
| users | 4 | ✅ Complete |
| shift_reports | 0 | ⚠️ Empty |
| attachments | 0 | ⚠️ Empty |
| comments | 0 | ⚠️ Empty |
| comment_likes | 0 | ⚠️ Empty |
| daily_post_trackers | 0 | ⚠️ Empty |
| report_acknowledgements | 0 | ⚠️ Empty |

**Note:** Empty tables are normal if the database was recently cleared. The schema will still be created for these tables.

## 👥 Exported Users

The following users were exported:

1. **jpress** - Super Admin (Jared Press)
2. **mlopez** - Manager (Miranda Lopez)
3. **staff** - Employee (FrontDesk Person)
4. **deleted_user_system** - System user (archived)

These users will be imported into Cloud SQL with their hashed passwords intact.

## 🔧 Scripts Documentation

### export_from_abacusai.js

Exports all data from Abacus.AI database to JSON files.

**Usage:**
```bash
npm run export
```

**What it does:**
- Connects to Abacus.AI PostgreSQL database
- Exports all tables in dependency order
- Creates individual JSON files for each table
- Creates complete export in `abacusai_data_export.json`

### import_to_cloudsql.js

Imports exported data into Cloud SQL database.

**Usage:**
```bash
npm run import
```

**Requirements:**
- Schema must already exist in Cloud SQL
- Run `setup_schema.sh` first

**What it does:**
- Reads `abacusai_data_export.json`
- Imports data in correct order (respecting foreign keys)
- Skips conflicts (if data already exists)
- Shows progress for each table

### test_cloudsql_connection.js

Tests connection to Cloud SQL and displays database info.

**Usage:**
```bash
npm run test
```

**What it shows:**
- Connection status
- Database version
- Current timestamp
- List of existing tables
- Row counts (if tables exist)

### setup_schema.sh

Creates database schema using Prisma.

**Usage:**
```bash
cd /home/ubuntu/hotel_shift_log
./migration_data/setup_schema.sh
```

**Requirements:**
- `.env.cloudsql` file must exist in project root
- Contains correct DATABASE_URL

**What it does:**
- Generates Prisma client
- Pushes schema to Cloud SQL
- Creates all tables, enums, and relationships
- Verifies schema creation

## 🔌 Database Connection Strings

### For Scripts (Direct IP):
```
postgresql://hotel-shift-log-db:ebf4vem5mzx8yuy*FJE@34.133.148.252:5432/hotelshiftlog
```

### For Cloud Run (Unix Socket):
```
postgresql://hotel-shift-log-db:ebf4vem5mzx8yuy*FJE@/hotelshiftlog?host=/cloudsql/houston-front-desk-shift-logs:us-central1:hotel-shift-log-db
```

**Important:** Use direct IP for migration scripts, Unix socket for Cloud Run deployment.

## 📝 Environment Files

### `.env.cloudsql` (in project root)

Contains environment variables for Cloud SQL:

```env
DATABASE_URL="postgresql://hotel-shift-log-db:ebf4vem5mzx8yuy*FJE@/hotelshiftlog?host=/cloudsql/houston-front-desk-shift-logs:us-central1:hotel-shift-log-db"
NEXTAUTH_SECRET="fdnkd5d96U1"
NEXTAUTH_URL="https://hotel-shift-log-143559442445.us-central1.run.app"
```

This file is used by:
- `setup_schema.sh` script
- Local testing (copy to `.env.local`)
- Reference for Cloud Run deployment

## ⚠️ Important Notes

### Database Selection

**Use `hotelshiftlog` database** (NOT `postgres`):
- ✅ Correct: `/hotelshiftlog?host=...`
- ❌ Wrong: `/postgres?host=...`

The `postgres` database is a system database. Your application data should be in `hotelshiftlog`.

### Connection Methods

| Environment | Method | Format |
|-------------|--------|--------|
| **Migration Scripts** | Direct IP | `@34.133.148.252:5432` |
| **Local Development** | Direct IP | `@34.133.148.252:5432` |
| **Cloud Run** | Unix Socket | `@/dbname?host=/cloudsql/...` |

### File Uploads

Current exported data **does not include uploaded files** from the filesystem.

**If you have uploaded files:**
1. Files are stored in `nextjs_space/Uploads/` directory
2. File metadata is in `attachments` table (0 rows currently)
3. For Cloud Run, consider migrating to Google Cloud Storage

## 🐛 Troubleshooting

### "Cannot connect to Cloud SQL"

**Solution:**
- Ensure you're using the correct connection string
- For migration scripts, use direct IP connection
- Check that Cloud SQL public IP is enabled
- Verify your IP is authorized (or use Cloud Shell)

### "Tables already exist"

**Solution:**
- This is okay! The import script uses `ON CONFLICT DO NOTHING`
- Existing data will be preserved
- Only new records will be added

### "Prisma client not found"

**Solution:**
```bash
cd /home/ubuntu/hotel_shift_log/nextjs_space
npx prisma generate
```

### Connection timeout

**Solution:**

If direct IP connection times out, use Google Cloud Shell:

```bash
# In Cloud Shell
git clone https://github.com/jpress-knighted/Hotel_Front_Desk_Shift_Log.git
cd Hotel_Front_Desk_Shift_Log/migration_data
npm install
npm run import
```

## 📖 Full Documentation

For complete step-by-step instructions, see:
**[CLOUD_SQL_MIGRATION_GUIDE.md](../CLOUD_SQL_MIGRATION_GUIDE.md)**

## ✅ Migration Checklist

- [x] Export data from Abacus.AI (4 users exported)
- [ ] Create schema in Cloud SQL
- [ ] Import data to Cloud SQL
- [ ] Test connection
- [ ] Update Cloud Run environment variables
- [ ] Deploy to Cloud Run
- [ ] Verify application works
- [ ] Test login with existing users

## 🎯 Next Immediate Step

Run the schema setup:

```bash
cd /home/ubuntu/hotel_shift_log
./migration_data/setup_schema.sh
```

Then import the data:

```bash
cd migration_data
npm run import
```

---

**Export completed:** October 30, 2025
**Users exported:** 4 (jpress, mlopez, staff, deleted_user_system)
**Ready for import:** ✅ Yes
