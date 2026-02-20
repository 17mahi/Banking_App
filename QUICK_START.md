# Quick Start Guide

## 🚀 Running Locally

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Start Backend Server
```bash
npm run dev
```
Backend runs on `http://localhost:5000`

### 3. Open Frontend
- Simply open `frontend/index.html` in your browser
- Or use a local server:
  ```bash
  cd frontend
  npx http-server -p 8000
  ```
  Then visit `http://localhost:8000`

## 📦 Deploying to Vercel

### Quick Deploy (GitHub Integration)
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Click Deploy
5. Done! 🎉

### CLI Deploy
```bash
npm install -g vercel
vercel login
vercel --prod
```

## 🧪 Testing the App

1. **Register**: Create a new account
2. **Login**: Use your credentials
3. **Dashboard**: View accounts and balances
4. **Transfer**: Move money between accounts
5. **Transactions**: Click an account to see history

## 📝 Notes

- Database file (`kodbank.db`) is created automatically on first run
- JWT tokens are stored in browser localStorage
- On Vercel, database resets on each deployment (serverless limitation)
