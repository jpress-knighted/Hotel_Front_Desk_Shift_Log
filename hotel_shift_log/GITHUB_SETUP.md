
# GitHub Repository Setup Guide

This guide will help you push your Hotel Shift Log application to GitHub for deployment with Cloud Run.

---

## 📋 Prerequisites

- GitHub account (free): https://github.com/join
- Git installed locally (check with `git --version`)

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository details:
   - **Name**: `hotel-shift-log` (or your preferred name)
   - **Description**: "Hotel Shift Reporting Application"
   - **Visibility**: **Private** (recommended for production apps)
   - **Do NOT** initialize with README, .gitignore, or license (we have these)
3. Click **Create repository**

### Step 2: Push Code to GitHub

Open terminal in the project directory:

```bash
cd /home/ubuntu/hotel_shift_log

# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - Production ready Hotel Shift Log"

# Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/hotel-shift-log.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**If prompted for credentials**:
- Username: Your GitHub username
- Password: Use a [Personal Access Token](https://github.com/settings/tokens) (not your GitHub password)

### Step 3: Verify Upload

1. Go to `https://github.com/YOUR_USERNAME/hotel-shift-log`
2. You should see all your files

**✅ Done!** Your code is now on GitHub and ready for Cloud Run deployment.

---

## 🔐 Creating a Personal Access Token (If Needed)

If you need to create a token for authentication:

1. Go to https://github.com/settings/tokens
2. Click **Generate new token** → **Generate new token (classic)**
3. Settings:
   - **Note**: "Hotel Shift Log Deployment"
   - **Expiration**: 90 days (or your preference)
   - **Scopes**: Select `repo` (full control of private repositories)
4. Click **Generate token**
5. **Copy the token immediately** (you won't see it again!)
6. Use this token as your password when pushing to GitHub

---

## 🔄 Making Updates After Deployment

Once deployed to Cloud Run with continuous deployment:

```bash
# Make your code changes
# ...

# Stage changes
git add .

# Commit with descriptive message
git commit -m "Add new feature: XYZ"

# Push to GitHub
git push origin main

# Cloud Run automatically deploys your changes!
```

**Check deployment status**: https://console.cloud.google.com/cloud-build/builds

---

## 📁 What Gets Pushed to GitHub?

**Included** (tracked by Git):
- ✅ Source code
- ✅ Configuration files
- ✅ Database schema
- ✅ Documentation

**Excluded** (in .gitignore):
- ❌ node_modules/
- ❌ .env files (secrets)
- ❌ Build outputs
- ❌ User uploads

---

## 🔒 Security Best Practices

### ⚠️ NEVER commit these files:
- `.env` files with secrets
- Database credentials
- API keys
- User-uploaded files

### ✅ DO commit:
- Source code
- `.env.example` (template without real values)
- Documentation
- Configuration files

**If you accidentally commit secrets**:
1. Immediately delete the repository
2. Create a new one
3. Rotate all exposed credentials
4. Push cleaned code

---

## 🆘 Common Issues

### "Authentication failed"
**Solution**: Use a [Personal Access Token](https://github.com/settings/tokens) instead of your password

### "Repository not found"
**Solution**: Check the URL and ensure the repository exists at `github.com/YOUR_USERNAME/hotel-shift-log`

### "Permission denied"
**Solution**: Ensure you have write access to the repository (you should if you created it)

### ".env file appears in GitHub"
**Solution**:
1. Remove it immediately: `git rm --cached .env`
2. Commit: `git commit -m "Remove .env file"`
3. Push: `git push origin main`
4. Rotate all secrets in the file

---

## 📞 Support

- **GitHub Docs**: https://docs.github.com
- **Git Docs**: https://git-scm.com/doc
- **GitHub Support**: https://support.github.com

---

**Last Updated**: October 23, 2025
