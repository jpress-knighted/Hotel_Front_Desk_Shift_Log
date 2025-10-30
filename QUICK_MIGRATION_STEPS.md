
# Quick Migration Steps

Fast-track guide to migrate to Cloud SQL in 5 minutes.

## ✅ Status: Export Complete

Your data has been exported from Abacus.AI database:
- ✅ 4 users exported and ready to import
- ✅ All files created in `/home/ubuntu/hotel_shift_log/migration_data/`

## 🚀 Next Steps (Choose One Method)

### Method A: Using Prisma (Recommended)

```bash
# Step 1: Setup schema in Cloud SQL
cd /home/ubuntu/hotel_shift_log
./migration_data/setup_schema.sh

# Step 2: Import data
cd migration_data
npm run import

# Step 3: Test
npm run test
```

### Method B: Using Cloud Shell (If Method A fails)

1. **Open Google Cloud Shell** from GCP Console

2. **Clone and setup:**
```bash
cd ~
git clone https://github.com/jpress-knighted/Hotel_Front_Desk_Shift_Log.git
cd Hotel_Front_Desk_Shift_Log/migration_data
npm install
```

3. **Import your exported data:**

First, copy your exported data file to Cloud Shell:
- Download `abacusai_data_export.json` from `/home/ubuntu/hotel_shift_log/migration_data/`
- Upload it to Cloud Shell

Then run:
```bash
npm run import
```

### Method C: Manual SQL (Alternative)

```bash
# Generate SQL schema file
cd /home/ubuntu/hotel_shift_log/migration_data
node generate_sql_schema.js

# This creates schema.sql file
# Then apply it using Cloud SQL console or psql
```

## 🔧 Update Cloud Run

After migration is complete:

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click **hotel-shift-log** service
3. Click **EDIT & DEPLOY NEW REVISION**
4. Update these environment variables:

```
DATABASE_URL = postgresql://hotel-shift-log-db:ebf4vem5mzx8yuy*FJE@/hotelshiftlog?host=/cloudsql/houston-front-desk-shift-logs:us-central1:hotel-shift-log-db

NEXTAUTH_SECRET = fdnkd5d96U1

NEXTAUTH_URL = https://hotel-shift-log-143559442445.us-central1.run.app
```

5. Verify **Cloud SQL connection** is enabled under "Connections" tab
6. Click **DEPLOY**

## 🧪 Test After Deployment

Visit: https://hotel-shift-log-143559442445.us-central1.run.app

**Test Login with:**
- Username: `jpress` (Super Admin)
- Username: `mlopez` (Manager)
- Username: `staff` (Employee)

Passwords remain the same as before.

## 📚 Need More Details?

See full documentation:
- [CLOUD_SQL_MIGRATION_GUIDE.md](./CLOUD_SQL_MIGRATION_GUIDE.md) - Complete guide
- [migration_data/README.md](./migration_data/README.md) - Scripts documentation

## ⚡ Fastest Path (For Urgent Migration)

If you need to get this working RIGHT NOW:

1. **Use Google Cloud Shell** (has direct access to Cloud SQL)
2. **Setup schema:**
   ```bash
   # In Cloud Shell
   cd Hotel_Front_Desk_Shift_Log/nextjs_space
   npx prisma db push
   ```

3. **Import data:**
   ```bash
   cd ../migration_data
   npm run import
   ```

4. **Update Cloud Run** (see above)

5. **Done!** 🎉

---

**Current Status:** ✅ Ready to import (4 users exported)
**Estimated Time:** 5-10 minutes
**Recommended Method:** Use Google Cloud Shell for fastest results
