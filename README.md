# Kodbank – Demo Banking App

Kodbank is a small full‑stack demo of a digital banking application with:

- **Backend**: Node.js + Express + SQLite (JWT auth, accounts, transfers)
- **Frontend**: Static HTML/CSS/JS with a colorful, modern dashboard

> This is a learning/demo project only – no real money is moved.

---

## 1. Prerequisites

- **Node.js** (LTS version recommended, e.g. 18+)
- **npm** (comes with Node)

---

## 2. Install & Run Backend

1. Open a terminal in the project root:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the backend server:

   ```bash
   npm run dev
   ```

4. The API will be available at:

   - `http://localhost:5000/api`
   - Health check: `http://localhost:5000/api/health`

The first time you register a user, a local SQLite database file `kodbank.db` is created in `backend/`.

---

## 3. Open the Frontend

The frontend is a simple static site; you can open it directly in your browser.

1. In your file explorer, navigate to:

   - `frontend/index.html`

2. Double‑click `index.html` to open it in your browser  
   (or serve the `frontend/` folder with any static server if you prefer).

> Make sure the backend is running on `http://localhost:5000` before you log in or register.

---

## 4. Features

- **Registration**
  - Create a new Kodbank user with name, email, and password.
  - Automatically gets demo accounts such as checking and savings with starting balances.

- **Login**
  - Email + password authentication.
  - JWT token stored in `localStorage` to keep you logged in.

- **Dashboard**
  - Displays your name and total balance across all accounts.
  - Lists each account with its type and current balance.
  - Shows recent transactions for the selected account.

- **Internal Transfers**
  - Transfer between any of your Kodbank accounts.
  - Balances update immediately and two transactions are recorded (debit + credit).

- **Colorful, Modern UI**
  - Inspired by real‑world digital banking apps with gradients and glassmorphism.

---

## 5. API Overview (for reference)

- `POST /api/auth/register` – `{ name, email, password }`
- `POST /api/auth/login` – `{ email, password }`
- `GET /api/profile` – requires `Authorization: Bearer <token>`
- `GET /api/accounts` – list of user accounts
- `GET /api/accounts/:id/transactions` – transactions for one account
- `POST /api/transfer` – `{ fromAccountId, toAccountId, amount, description? }`

---

---

## 6. Deploy to GitHub

1. **Initialize Git repository** (if not already done):

   ```bash
   git init
   git add .
   git commit -m "Initial commit: Kodbank banking app"
   ```

2. **Create a new repository on GitHub**:
   - Go to [GitHub](https://github.com/new)
   - Create a new repository (e.g., `kodbank-app`)
   - **Don't** initialize with README, .gitignore, or license

3. **Push to GitHub**:

   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/kodbank-app.git
   git branch -M main
   git push -u origin main
   ```

---

## 7. Deploy to Vercel

### Option A: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not installed):

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:

   ```bash
   vercel login
   ```

3. **Deploy**:

   ```bash
   vercel
   ```

   Follow the prompts:
   - Link to existing project? **No** (first time)
   - Project name: `kodbank-app` (or your choice)
   - Directory: `.` (current directory)
   - Override settings? **No**

4. **Deploy to production**:

   ```bash
   vercel --prod
   ```

### Option B: Deploy via GitHub Integration (Recommended)

1. **Push your code to GitHub** (see section 6 above)

2. **Go to Vercel Dashboard**:
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub

3. **Import Project**:
   - Click **"Add New..."** → **"Project"**
   - Import your `kodbank-app` repository
   - Vercel will auto-detect settings from `vercel.json`

4. **Configure Environment Variables** (optional):
   - Go to **Settings** → **Environment Variables**
   - Add `JWT_SECRET` if you want a custom secret (default works for demo)

5. **Deploy**:
   - Click **"Deploy"**
   - Wait for build to complete
   - Your app will be live at `https://your-app-name.vercel.app`

### Important Notes for Vercel Deployment

- ✅ The app automatically detects production vs local development
- ✅ API routes work at `/api/*` on Vercel
- ✅ Frontend is served as static files
- ⚠️ **SQLite database resets on each deployment** (Vercel serverless functions are stateless)
- 💡 For persistent data, consider using a cloud database (e.g., PostgreSQL, MongoDB Atlas)

---

## 8. Running the App Locally

### Quick Start

1. **Start Backend**:

   ```bash
   cd backend
   npm install
   npm run dev
   ```

   Backend runs on `http://localhost:5000`

2. **Open Frontend**:
   - Open `frontend/index.html` in your browser
   - Or use a simple HTTP server:
     ```bash
     # Using Python
     cd frontend
     python -m http.server 8000
     # Then visit http://localhost:8000
     
     # Or using Node.js http-server
     npx http-server frontend -p 8000
     ```

### Full Development Setup

For a better development experience, you can run both together:

**Terminal 1** (Backend):
```bash
cd backend
npm install
npm run dev
```

**Terminal 2** (Frontend - optional HTTP server):
```bash
cd frontend
npx http-server -p 8000 -c-1
```

Then visit `http://localhost:8000` in your browser.

---

## 9. Project Structure

```
Banking_App/
├── backend/
│   ├── server.js          # Express API server
│   ├── db.js              # SQLite database setup
│   ├── package.json       # Backend dependencies
│   └── kodbank.db         # SQLite database (created on first run, gitignored)
├── frontend/
│   ├── index.html         # Main HTML file
│   ├── styles.css         # Styling
│   └── app.js             # Frontend JavaScript
├── api/
│   └── index.js           # Vercel serverless entry point
├── vercel.json            # Vercel deployment config
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

---

## 10. Notes

- Default JWT secret is hard‑coded for simplicity in `backend/server.js`.  
  For production use, set `JWT_SECRET` environment variable.
- CORS is enabled so that the static frontend can call the backend from your browser.
- SQLite database is stored in `/tmp` on Vercel (ephemeral - resets on each deployment).
- For persistent production data, consider migrating to a cloud database service.

