# GitHub Setup Instructions

Follow these steps to push your Kodbank app to GitHub.

## Step 1: Initialize Git Repository

Open terminal in your project root (`Banking_App` folder) and run:

```bash
git init
git add .
git commit -m "Initial commit: Kodbank banking app"
```

## Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `kodbank-app` (or your preferred name)
3. Description: "Demo banking app with registration, login, and transfers"
4. Choose **Public** or **Private**
5. **DO NOT** check "Initialize with README" (we already have one)
6. Click **"Create repository"**

## Step 3: Connect and Push

GitHub will show you commands. Use these:

```bash
git remote add origin https://github.com/YOUR_USERNAME/kodbank-app.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 4: Verify

1. Refresh your GitHub repository page
2. You should see all files:
   - `backend/`
   - `frontend/`
   - `api/`
   - `README.md`
   - `vercel.json`
   - `.gitignore`
   - etc.

## What Gets Pushed?

✅ All source code  
✅ Configuration files  
✅ Documentation  

❌ `node_modules/` (ignored)  
❌ `*.db` database files (ignored)  
❌ `.env` files (ignored)  

## Next Steps

After pushing to GitHub, proceed to deploy on Vercel (see `DEPLOYMENT.md` or `README.md`).
