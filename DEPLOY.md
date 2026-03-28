# 🚀 Deploy to Production (Vercel + Railway) — Step by Step

This guide will get your app live in **20 minutes, completely free**.

## What You'll Get

| Component | Platform | URL | Cost |
|-----------|----------|-----|------|
| Frontend | Vercel | `your-app.vercel.app` | Free |
| Backend API | Railway | `api.your-railway.app` | Free (500 hrs/mo) |
| Database | Railway | Managed PostgreSQL | Free (5GB) |

**Total cost: £0** ✅

---

## Prerequisites

You'll need:
- GitHub account (free at https://github.com)
- Vercel account (free at https://vercel.com)
- Railway account (free at https://railway.app)

---

## Step 1: Push Code to GitHub (5 minutes)

### 1.1: Create a GitHub repository

1. Go to https://github.com/new
2. Name it: `mortgage-broker-app`
3. Keep it public
4. Click "Create repository"
5. Copy the commands shown (should look like below)

### 1.2: Push your local code to GitHub

```bash
cd "/Users/hs/Desktop/Mortgage - Full app v1"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: production-ready mortgage broker app"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/mortgage-broker-app.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Done!** Your code is now on GitHub at `github.com/YOUR_USERNAME/mortgage-broker-app`

---

## Step 2: Deploy Backend to Railway (5 minutes)

### 2.1: Sign up for Railway

1. Go to https://railway.app
2. Click "Start Project"
3. Sign in with GitHub (easiest)
4. Authorize Railway to access GitHub

### 2.2: Create a new project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Find and select `mortgage-broker-app`
4. Click "Deploy"

Railway will automatically detect `server/` folder and start deploying.

### 2.3: Set up environment variables

While it's deploying, click on the Backend service and set these variables:

```
NODE_ENV=production
PORT=5000
JWT_SECRET=change_this_to_something_random_123456789
CORS_ORIGIN=https://YOUR_VERCEL_DOMAIN.vercel.app
MORTGAGE_DATA_PROVIDER=mock
```

**How to get the PostgreSQL connection string:**
1. In Railway dashboard, click on PostgreSQL service
2. Click "Connect"
3. Copy the "DATABASE_URL" value
4. Set it as an env variable in the Backend service

### 2.4: Set PostgreSQL variables

In the Backend service, also add:
```
DATABASE_URL=(copy from PostgreSQL service)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=railway
DATABASE_USER=postgres
DATABASE_PASSWORD=(will be set by Railway)
```

Actually, Railway auto-sets these. Just use the `DATABASE_URL`.

### 2.5: Get your backend URL

In Railway dashboard:
1. Click on Backend service
2. Look for "Deployments"
3. Find the "Railway URL" (something like `api-prod-abcd.railway.app`)
4. Copy this — you'll need it for the frontend

**Backend is now live!** Test it:
```bash
curl https://api-prod-xyz.railway.app/health
```

Should return: `{"status":"ok",...}`

---

## Step 3: Deploy Frontend to Vercel (5 minutes)

### 3.1: Connect Vercel to GitHub

1. Go to https://vercel.com
2. Sign up with GitHub or Email
3. Click "Import Project"
4. Paste your GitHub repo URL: `https://github.com/YOUR_USERNAME/mortgage-broker-app`
5. Click "Continue"

### 3.2: Configure the build

Vercel will ask about the project:

**Root Directory:** Select `client/` (where your React app is)

**Build Command:** Keep as suggested (should be `npm run build`)

**Output Directory:** Keep as suggested (should be `dist`)

**Environment Variables:** Click "Add Environment Variable"

Name: `VITE_API_URL`
Value: `https://api-prod-xyz.railway.app` (your Railway backend URL from Step 2.5)

Click "Add"

### 3.3: Deploy

Click "Deploy"

Vercel will:
1. Clone your repo
2. Run `npm install` in the `client/` folder
3. Run `npm run build`
4. Upload the built files
5. Assign you a URL like `mortgage-broker-app.vercel.app`

**Takes 2-3 minutes.**

Watch the deployment progress. When complete, click "Visit" to see your live app!

---

## Step 4: Test Everything (2 minutes)

### 4.1: Test the frontend

1. Go to `https://your-app.vercel.app`
2. You should see the mortgage wizard
3. Fill out the form
4. Click "Find Deals"
5. Should see the calculation results with 8 sample deals

### 4.2: Test the backend API directly

```bash
# Replace with your actual Railway URL
curl https://api-prod-xyz.railway.app/api

# Should return API documentation
```

### 4.3: Test full flow

1. Go to frontend
2. Register a new account
3. Run calculations
4. Save a scenario
5. Reload page
6. Load the scenario back

**Everything working?** 🎉 **You're live!**

---

## Troubleshooting

### Frontend shows "API Error"

**Problem:** Frontend can't connect to backend

**Solution:**
1. Check the VITE_API_URL environment variable in Vercel
2. Make sure Railway backend is running (check Railway dashboard)
3. Clear browser cache (Ctrl+Shift+Delete)
4. Redeploy frontend (Vercel > Deployments > Redeploy)

### Backend returns 500 error

**Problem:** Backend crashed or database not connected

**Solution:**
1. Check Railway logs (click Backend > Deployments > View Logs)
2. Verify DATABASE_URL is set correctly
3. Verify migrations ran (check logs for "migrations completed")
4. Restart the service (Railway > Backend > ... > Restart)

### Database not found

**Problem:** PostgreSQL not set up

**Solution:**
1. Go to Railway dashboard
2. Click "New Service"
3. Select "Database"
4. Select "PostgreSQL"
5. Copy the DATABASE_URL
6. Set it in Backend environment variables
7. Restart Backend service

### "Deployment still in progress"

**Solution:** Just wait. Vercel/Railway take 2-5 minutes first time. Check the build logs.

---

## Making Changes & Redeploying

After you make changes:

```bash
# Make your changes locally
# Test: npm run dev

# When ready, push to GitHub:
git add .
git commit -m "Your change description"
git push

# Vercel & Railway automatically redeploy!
# Takes 1-2 minutes
```

Both Vercel and Railway watch your GitHub repo. Every push triggers an automatic deployment.

---

## Monitoring Your Apps

### Vercel Dashboard
- https://vercel.com/dashboard
- See all deployments
- Check build logs
- View analytics
- Redeploy anytime

### Railway Dashboard
- https://railway.app/dashboard
- See database status
- Check API logs
- Monitor CPU/memory
- View deployment history

---

## Adding a Custom Domain (Optional, Costs Money)

When you want your own domain (e.g., `mortgage.yourcompany.com`):

1. **Buy a domain** from GoDaddy, Namecheap, etc. (~£10/year)
2. **Connect to Vercel:**
   - Vercel dashboard > your project > Settings > Domains
   - Add your domain
   - Follow Vercel's DNS instructions
3. **Backend domain** (optional)
   - Similar process in Railway
   - Or just use the Railway URL

For now, your free domains are:
- Frontend: `mortgage-broker-app.vercel.app`
- Backend: `api-prod-xyz.railway.app`

---

## Free Tier Limits (Know Before You Go Big)

### Vercel Free
- 100 deployments/day
- Serverless functions capped at 12s
- 100GB bandwidth/month
- Perfect for this app

### Railway Free
- 500 hours/month (about 20 days continuous)
- 5GB Postgres storage
- Perfect for testing and demo
- When you launch for real traffic, upgrade (~£5-20/month)

For now, plenty of room.

---

## Next Steps

Once live:

1. **Test thoroughly:**
   - Different scenarios
   - Register multiple users
   - Save/load scenarios
   - Mobile responsiveness

2. **When ready for real data:**
   - Contact Moneyfacts
   - Get API credentials
   - Implement real API provider (see MONEYFACTS_INTEGRATION.md)
   - Update Backend code
   - Push to GitHub
   - Auto-redeploys

3. **When ready to go serious:**
   - Upgrade to paid tiers
   - Add custom domain
   - Set up SSL (Vercel does automatically)
   - Monitor analytics
   - Scale database if needed

---

## Deployed! Share Your Links

Once deployed:

**Share with people like this:**

"Check out my mortgage comparison app: https://mortgage-broker-app.vercel.app"

They can:
- See the wizard
- Fill out their details
- Get deal recommendations
- See all calculations
- Save scenarios

All completely free and live!

---

## Support

**Vercel help:** https://vercel.com/docs
**Railway help:** https://docs.railway.app
**GitHub help:** https://docs.github.com

---

**Status:** Backend ✅ Deployed | Frontend ✅ Deployed | Database ✅ Ready

You're live! 🎉
