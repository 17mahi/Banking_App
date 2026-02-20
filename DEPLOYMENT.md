# Deployment Guide for Kodbank

This guide covers deploying Kodbank to Vercel step-by-step.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Git installed locally

## Step 1: Push to GitHub

1. **Initialize Git** (if not done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Kodbank app"
   ```

2. **Create GitHub Repository**:
   - Go to https://github.com/new
   - Name it `kodbank-app` (or your choice)
   - Don't initialize with README
   - Click "Create repository"

3. **Push Code**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/kodbank-app.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Deploy to Vercel

### Method 1: GitHub Integration (Easiest)

1. **Go to Vercel**: https://vercel.com
2. **Sign in** with GitHub
3. **Click "Add New..." → "Project"**
4. **Import** your `kodbank-app` repository
5. **Configure**:
   - Framework Preset: **Other**
   - Root Directory: `.` (leave default)
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
6. **Click "Deploy"**
7. **Wait** for deployment (usually 1-2 minutes)
8. **Visit** your live app at `https://your-app-name.vercel.app`

### Method 2: Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   - Follow prompts
   - First time: Link to project? **No**
   - Project name: `kodbank-app`
   - Directory: `.`

4. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

## Step 3: Verify Deployment

1. Visit your Vercel URL (e.g., `https://kodbank-app.vercel.app`)
2. Try registering a new account
3. Test login and dashboard features
4. Test transferring money between accounts

## Troubleshooting

### API Routes Not Working

- Check Vercel deployment logs for errors
- Ensure `vercel.json` is in the root directory
- Verify `api/index.js` exists and exports the Express app

### Database Issues

- SQLite resets on each Vercel deployment (serverless functions are stateless)
- This is expected behavior for demo purposes
- For production, migrate to a cloud database (PostgreSQL, MongoDB, etc.)

### CORS Errors

- The app should auto-detect production vs local
- Check browser console for specific errors
- Ensure backend CORS allows your Vercel domain

## Environment Variables (Optional)

To set a custom JWT secret:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - Key: `JWT_SECRET`
   - Value: `your-secret-key-here`
   - Environment: Production, Preview, Development

3. Update `backend/server.js` to use:
   ```javascript
   const JWT_SECRET = process.env.JWT_SECRET || "super-secret-kodbank-key";
   ```

## Updating Your Deployment

After making changes:

1. **Commit and push** to GitHub:
   ```bash
   git add .
   git commit -m "Update: your changes"
   git push
   ```

2. **Vercel auto-deploys** if GitHub integration is enabled
   - Or manually trigger: `vercel --prod`

## Production Considerations

- ⚠️ **Database**: SQLite on Vercel is ephemeral. Use a cloud database for real apps.
- 🔒 **Security**: Set strong `JWT_SECRET` via environment variables
- 📊 **Monitoring**: Check Vercel logs for errors
- 🚀 **Performance**: Vercel CDN handles static files automatically
