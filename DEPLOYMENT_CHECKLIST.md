# 🚀 DEPLOYMENT CHECKLIST

Follow this to deploy to production in 20 minutes.

## 📋 Pre-Deployment Check

- [ ] All code committed locally
- [ ] Backend runs locally: `cd server && npm run dev`
- [ ] Frontend runs locally: `cd client && npm run dev`
- [ ] No error logs in console

## 1️⃣ GITHUB SETUP (5 min)

- [ ] Create GitHub account: https://github.com
- [ ] Create new repo: mortgage-broker-app
- [ ] Clone to your machine:
  ```bash
  cd "/Users/hs/Desktop/Mortgage - Full app v1"
  git init
  git add .
  git commit -m "Initial commit"
  git remote add origin https://github.com/YOUR_USERNAME/mortgage-broker-app.git
  git branch -M main
  git push -u origin main
  ```
- [ ] Verify on GitHub at: `github.com/YOUR_USERNAME/mortgage-broker-app`

## 2️⃣ RAILWAY SETUP - Backend + Database (5 min)

### 2.1 Create Railway Account
- [ ] Sign up: https://railway.app
- [ ] Sign in with GitHub (easiest)

### 2.2 Deploy Backend
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Choose `mortgage-broker-app`
- [ ] Click "Deploy"
- [ ] Wait for deployment (should say "Live")

### 2.3 Set Backend Environment Variables
In Railway dashboard, click Backend service, then "Variables":

```
NODE_ENV=production
PORT=5000
JWT_SECRET=your_random_secret_here_change_this_12345
MORTGAGE_DATA_PROVIDER=mock
```

- [ ] DATABASE_URL=postgres://... (copy from PostgreSQL service)
- [ ] CORS_ORIGIN=https://YOUR_VERCEL_DOMAIN.vercel.app

Don't know Vercel domain yet? Set it after Step 3.3

### 2.4 PostgreSQL Setup
- [ ] In Railway dashboard, click "New Service"
- [ ] Select "Database" → "PostgreSQL"
- [ ] Wait for it to be "Live"
- [ ] Click PostgreSQL service
- [ ] Click "Connect"
- [ ] Copy the "DATABASE_URL" value
- [ ] Go back to Backend service
- [ ] Paste DATABASE_URL in Variables

### 2.5 Get Your Backend URL
- [ ] Click Backend service → "Deployments" tab
- [ ] Look for "Railway URL" (e.g., `https://api-prod-abc123.railway.app`)
- [ ] **Copy this** — you'll need it in Step 3

- [ ] Test backend is working:
  ```bash
  curl https://YOUR_RAILWAY_URL/health
  ```
  Should return: `{"status":"ok"...}`

## 3️⃣ VERCEL SETUP - Frontend (5 min)

### 3.1 Create Vercel Account
- [ ] Sign up: https://vercel.com
- [ ] Sign in with GitHub

### 3.2 Deploy Frontend
- [ ] Click "Add New..." → "Project"
- [ ] Select "Import Git Repository"
- [ ] Paste: `https://github.com/YOUR_USERNAME/mortgage-broker-app`
- [ ] Click "Continue"

### 3.3 Configure Build
Vercel will ask for settings:

**Root Directory:** Select `client` from dropdown

**Build Command:** Keep default (npm run build)

**Output Directory:** Keep default (dist)

- [ ] Click "Add Environment Variable"
- [ ] Name: `VITE_API_URL`
- [ ] Value: `https://YOUR_RAILWAY_URL` (from Step 2.5)
- [ ] Click "Add"

### 3.4 Deploy
- [ ] Click "Deploy"
- [ ] Wait 2-3 minutes for build and deployment
- [ ] When complete, click "Visit" button
- [ ] You should see your app! 🎉

- [ ] **Copy your Vercel URL** (e.g., `https://mortgage-broker-app.vercel.app`)

### 3.5 Update Backend CORS
- [ ] Go back to Railway dashboard
- [ ] Click Backend service → Variables
- [ ] Update `CORS_ORIGIN` with your Vercel URL
- [ ] Click "Restart" on the Backend service
- [ ] Wait 30 seconds for it to restart

## 4️⃣ TEST EVERYTHING (2 min)

### 4.1 Frontend
- [ ] Open your Vercel URL in browser
- [ ] You should see the mortgage wizard
- [ ] Fill in a test scenario:
  - Property value: £300,000
  - Deposit: £60,000
  - Annual income: £55,000
  - Term: 25 years
- [ ] Click "Find My Best Deals"
- [ ] Should see 8 mortgage deals with calculations

### 4.2 Backend API
- [ ] Test API is responding:
  ```bash
  curl https://YOUR_RAILWAY_URL/api
  ```
  Should return API documentation

### 4.3 Full Flow
- [ ] Register a user account
- [ ] Calculate deals
- [ ] Save a scenario
- [ ] Reload the page
- [ ] Load the saved scenario
- [ ] Everything should work ✅

## 5️⃣ SHARE & CELEBRATE 🎉

Your app is now live!

**Frontend URL:** `https://YOUR_VERCEL_DOMAIN.vercel.app`
**Backend API:** `https://YOUR_RAILWAY_URL`
**GitHub:** `https://github.com/YOUR_USERNAME/mortgage-broker-app`

Share with others: "Check out my mortgage comparison app: https://YOUR_VERCEL_DOMAIN.vercel.app"

## ❓ Troubleshooting

### Frontend shows "API Error"
- [ ] Check CORS_ORIGIN in Railway Backend variables
- [ ] Verify Railway Backend is running (check Deployments tab)
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Restart Railway Backend service

### Database Error in Logs
- [ ] Verify DATABASE_URL is set in Backend variables
- [ ] PostgreSQL service should say "Live" in Railway
- [ ] Restart Backend service

### Build Failed
- [ ] Check build logs in Vercel (click failed Deployment)
- [ ] Common issues: missing files, wrong directory selected
- [ ] Try pushing a small change to GitHub to trigger rebuild

### "Still Deploying"
- Just wait. First time takes 2-5 minutes. Check the logs.

## 📚 Next Steps

Once deployed:

1. **Test thoroughly** with different scenarios
2. **Share with people** — get feedback
3. **When ready for real data:**
   - Contact Moneyfacts (see MONEYFACTS_INTEGRATION.md)
   - Get API credentials
   - Update Backend code
   - Push to GitHub (auto-redeploys)
4. **Monitor** your app in Vercel & Railway dashboards

## 💬 Questions?

- **Vercel help:** https://vercel.com/docs
- **Railway help:** https://docs.railway.app
- **Full deployment guide:** See DEPLOY.md

---

**You're deploying a production-grade mortgage broker app. This is the real thing!** 🚀

Follow these steps in order, and you'll have it live in under 20 minutes.
