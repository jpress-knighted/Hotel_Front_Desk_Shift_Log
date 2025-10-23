
# Cloud Run Deployment Stuck - Troubleshooting Guide

## Your Situation

You've completed the deployment setup through Step 5, but the Cloud Run URL shows a placeholder page after 30+ minutes. This means something failed during the build or deployment process.

**Normal behavior:** Deployment should complete in 5-10 minutes  
**Your experience:** 30+ minutes with placeholder  
**Diagnosis:** Build or deployment failure

---

## 🔍 Step 1: Check Cloud Run Service Status

### Navigate to Cloud Run Console
Go to: https://console.cloud.google.com/run

### Look at your service: `hotel-shift-log`

**What to check:**

1. **Status indicator (top of page):**
   - ✅ **Green checkmark** = Service running successfully
   - ⚠️ **Yellow warning** = Service deployed but having issues
   - ❌ **Red X** = Deployment failed
   - 🔄 **Blue spinner** = Still deploying (shouldn't take 30 min!)

2. **Active Revision:**
   - Look for "Active revision" section
   - If it says **"No active revision"** or shows old revision, deployment failed

3. **Error messages:**
   - Look for any red error banners at the top
   - Common errors:
     - "Build failed"
     - "Container failed to start"
     - "Health check failed"
     - "Permission denied"

---

## 🔍 Step 2: Check Cloud Build Logs (Most Important!)

Since you're deploying from GitHub, Cloud Build handles the Docker build. This is where most failures happen.

### Navigate to Cloud Build
Go to: https://console.cloud.google.com/cloud-build/builds

### Check Recent Builds

1. **Look at the most recent build** (should be at the top)

2. **Check the status:**
   - ✅ **Success** (green) = Build worked
   - ❌ **Failed** (red) = Build failed - **THIS IS LIKELY YOUR ISSUE**
   - 🔄 **In Progress** (blue) = Still building (shouldn't take 30 min)
   - ⏸️ **Queued** = Waiting to start

3. **If status is FAILED:**
   - Click on the build to see detailed logs
   - Scroll to the bottom for error messages
   - Look for red text indicating what failed

### Common Build Failures

#### Failure 1: Prisma Generation Error
```
Error: @prisma/client did not initialize yet
```
**Solution:** Need to add DATABASE_URL at build time

#### Failure 2: Missing Dependencies
```
Module not found: Can't resolve 'X'
```
**Solution:** Missing package in package.json

#### Failure 3: TypeScript Compilation Error
```
Type error: ...
```
**Solution:** Fix TypeScript errors in code

#### Failure 4: Out of Memory
```
Killed
Process exited with code 137
```
**Solution:** Need more memory for build

---

## 🔍 Step 3: Check Cloud Run Logs

Even if the build succeeded, the container might fail to start.

### Navigate to Cloud Run Service
Go to: https://console.cloud.google.com/run → `hotel-shift-log`

### Click "LOGS" tab (at the top)

### Look for error messages:

#### Common Startup Errors

**Error 1: Database Connection Failed**
```
Error: Can't reach database server
```
**Solution:** Cloud SQL connection not configured or DATABASE_URL secret wrong

**Error 2: Missing Environment Variables**
```
NEXTAUTH_URL is not defined
```
**Solution:** Environment variables not set in Cloud Run configuration

**Error 3: Port Binding Issue**
```
Error: listen EADDRINUSE
```
**Solution:** App not listening on PORT environment variable

**Error 4: Secret Access Denied**
```
Permission denied on secret
```
**Solution:** Service account needs Secret Manager permissions (from why_did_this_happen.md)

---

## 🔧 Quick Fixes Based on Common Issues

### Issue A: Build is Still Running After 30 Minutes

**This shouldn't happen. The build is likely stuck.**

**Fix:**
1. Go to Cloud Build → Find the running build
2. Click **"CANCEL"**
3. Go back to Cloud Run → Edit & Deploy New Revision
4. Click **DEPLOY** to retry

---

### Issue B: Build Failed with Prisma Error

**The build can't generate Prisma client without DATABASE_URL**

**Fix Option 1: Add Build Argument (Recommended)**

1. Go to Cloud Run → Edit & Deploy New Revision
2. Scroll to **"Build configuration"** section
3. Click **"Show Build Configuration"**
4. Under **"Build-time variables"**, add:
   - Name: `DATABASE_URL`
   - Value: `postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public`
   (Just a placeholder to let Prisma generate - real value comes from secrets at runtime)

**Fix Option 2: Update Dockerfile**

I can create a Dockerfile that handles this properly. Let me know if you need this.

---

### Issue C: Container Starts But Shows Placeholder

**This means the app started but isn't serving on the right port**

**Fix:**

Your Next.js app needs to listen on the PORT environment variable. This should already work, but verify:

1. Check Cloud Run logs for startup messages
2. Look for: `> Ready on http://localhost:3000` or similar
3. If you see errors about port 3000, the app isn't using $PORT

**Cloud Run requires apps to listen on PORT env var (usually 8080)**

Next.js should handle this automatically, but if not:

In your `package.json`, verify the start script:
```json
"start": "next start -p ${PORT:-3000}"
```

---

### Issue D: "Permission Denied" on Secrets

**You already know about this from why_did_this_happen.md**

**Quick fix:**
1. Go to: https://console.cloud.google.com/iam-admin/iam
2. Find service account: `143559442445-compute@developer.gserviceaccount.com`
3. Edit → Add role: "Secret Manager Secret Accessor"
4. Redeploy

---

## 🎯 What You Should Do Right Now

### Step 1: Check Build Status (MOST IMPORTANT)

1. Go to: https://console.cloud.google.com/cloud-build/builds
2. Look at the most recent build
3. **If FAILED:**
   - Click on it
   - Read the error messages
   - Take a screenshot of the error
   - Share it with me for specific help

### Step 2: Check Cloud Run Status

1. Go to: https://console.cloud.google.com/run
2. Click on `hotel-shift-log`
3. Look for error messages
4. Check what revision is active

### Step 3: Check Logs

1. In Cloud Run service → **LOGS** tab
2. Look for red error messages
3. Copy any error text you see

---

## 📸 What to Share With Me

To help you debug, please share:

1. **Cloud Build status:**
   - Screenshot of Cloud Build history showing recent builds
   - If failed, screenshot of the error in logs

2. **Cloud Run service status:**
   - Screenshot of the main Cloud Run service page
   - Any error messages visible

3. **Cloud Run logs:**
   - Copy/paste any error messages from the Logs tab
   - Specifically look for errors about:
     - Database connection
     - Environment variables
     - Port binding
     - Secrets access

---

## 🚀 Most Likely Issues (Ranked by Probability)

Based on typical Cloud Run + Next.js + Prisma deployments:

1. **Build failed due to Prisma** (60% chance)
   - Fix: Add DATABASE_URL build arg (see Issue B above)

2. **Secret Manager permissions** (25% chance)
   - Fix: Grant "Secret Manager Secret Accessor" role

3. **Cloud SQL connection not configured** (10% chance)
   - Fix: Verify Cloud SQL instance is connected in Cloud Run config

4. **Environment variables missing** (5% chance)
   - Fix: Double-check all env vars are set

---

## 🆘 Emergency Reset Option

If nothing works and you want to start fresh:

1. **Delete the Cloud Run service:**
   - Cloud Run Console → hotel-shift-log → DELETE
   
2. **Start deployment from scratch:**
   - Follow DEPLOYMENT_CHECKLIST.md again
   - This time, I can help you catch any configuration errors early

**Note:** This won't delete your database or secrets, just the Cloud Run service config.

---

## 💬 Next Steps

Please check the items above and let me know:

1. What is the Cloud Build status? (Success/Failed/Running)
2. What is the Cloud Run service status? (Active/Failed/No active revision)
3. Any error messages in logs?

Once I know what the specific error is, I can give you exact steps to fix it!

---

**Remember:** A 30-minute deployment that shows a placeholder is NOT normal. Something definitely failed. The good news is that build/deployment errors are usually easy to fix once we identify them! 🔧

