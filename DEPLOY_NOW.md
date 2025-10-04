# 🚀 Deploy Now - Step by Step

I've prepared everything for you! Follow these steps:

## ✅ What's Ready

- ✅ Git repository initialized
- ✅ All files committed
- ✅ Railway configuration files created
- ✅ Browser opened to Railway

## 📋 Step-by-Step Deployment

### Step 1: Create GitHub Repository (2 minutes)

The code is ready but needs to be on GitHub for Railway to deploy it.

**Option A: GitHub CLI (Fastest)**
```bash
cd /Users/youssefahmani/Downloads/Roaster/Roaster/external-service

# Create repo on GitHub
gh repo create scratcher-service --public --source=. --remote=origin --push
```

**Option B: GitHub Web (Manual)**
1. Go to https://github.com/new
2. Repository name: `scratcher-service`
3. Make it Public
4. **Don't** initialize with README
5. Click "Create repository"
6. Then run:
```bash
cd /Users/youssefahmani/Downloads/Roaster/Roaster/external-service
git remote add origin https://github.com/YOUR-USERNAME/scratcher-service.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Railway (3 minutes)

The browser should have opened Railway. If not, go to: https://railway.app/new

1. **Sign in with GitHub**
   - Click "Login with GitHub"
   - Authorize Railway

2. **Create New Project**
   - Click "Deploy from GitHub repo"
   - Select `scratcher-service` repository
   - Click "Deploy Now"

3. **Railway will auto-detect Node.js and start deploying!**
   - Wait ~30 seconds for deployment

### Step 3: Add PostgreSQL (1 minute)

In your Railway project:

1. Click **"New"** button (top right)
2. Select **"Database"**
3. Click **"Add PostgreSQL"**
4. Done! Railway automatically connects it

### Step 4: Set Environment Variables (2 minutes)

1. Click on your **service** (not the database)
2. Go to **"Variables"** tab
3. Click **"Raw Editor"**
4. Paste this (update with your values):

```env
SF_LOGIN_URL=https://login.salesforce.com
SF_USERNAME=youssef.ahmani@playful-panda-a61dyz.com
SF_PASSWORD=YOUR_PASSWORD_HERE
SF_SECURITY_TOKEN=YOUR_TOKEN_HERE
API_KEY=PASTE_GENERATED_KEY_HERE
CORS_ORIGIN=https://playful-panda-a61dyz-dev-ed.my.salesforce.com
POLL_INTERVAL_MINUTES=5
MAX_CHANGES_PER_ORG=50
NODE_ENV=production
PORT=3000
```

**Generate API Key:**
```bash
openssl rand -hex 32
```

5. Click **"Update Variables"**
6. Service will auto-redeploy

### Step 5: Get Your URL (1 minute)

1. Click **"Settings"** tab
2. Scroll to **"Domains"**
3. Click **"Generate Domain"**
4. Copy the URL (e.g., `scratcher-production.up.railway.app`)

### Step 6: Initialize Database (1 minute)

**Option A: Auto-initialize (Easiest)**
The server will auto-initialize on first startup. Just wait 30 seconds after deployment.

**Option B: Manual (If needed)**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
cd /Users/youssefahmani/Downloads/Roaster/Roaster/external-service
railway link

# Run setup
railway run node scripts/setup-database.js
```

### Step 7: Test Your Deployment (1 minute)

```bash
# Replace with your actual values
URL="https://scratcher-production.up.railway.app"
API_KEY="your-api-key-from-railway"

# Test health
curl $URL/health

# Should return: {"status":"healthy",...}

# Test API
curl -H "X-API-Key: $API_KEY" $URL/api/changes

# Should return: {"success":true,"changes":[...]}
```

### Step 8: Configure Salesforce (3 minutes)

**A. Add Remote Site Setting**

1. Open Salesforce Setup
2. Search for "Remote Site Settings"
3. Click "New Remote Site"
4. Fill in:
   - Name: `Scratcher_Railway`
   - URL: `https://scratcher-production.up.railway.app` (your Railway URL)
   - Active: ✅
5. Save

**B. Update Apex Class**

Edit this file:
`/Users/youssefahmani/Downloads/Roaster/Roaster/force-app/main/default/classes/ScratcherExternalService.cls`

Update lines 6-13:
```apex
private static String getServiceUrl() {
    return 'https://scratcher-production.up.railway.app';  // Your Railway URL
}

private static String getApiKey() {
    return 'your-api-key-from-railway';  // From Railway Variables tab
}
```

**C. Deploy to Salesforce**
```bash
cd /Users/youssefahmani/Downloads/Roaster/Roaster
sf project deploy start --source-dir force-app/main/default/classes/ScratcherExternalService.cls
```

### Step 9: View in Salesforce! 🎉

1. Open your DevHub org
2. Navigate to the Scratcher page
3. **You should see changes from ALL your scratch orgs!**

## ✅ Verification Checklist

- [ ] Railway project created
- [ ] PostgreSQL database added
- [ ] Environment variables set
- [ ] Domain generated
- [ ] Database initialized
- [ ] API responding to health check
- [ ] Remote Site Setting added in Salesforce
- [ ] Apex class updated with Railway URL
- [ ] Apex class deployed to Salesforce
- [ ] Component showing data in DevHub

## 🎯 Expected Results

In your DevHub Scratcher component, you should see:

```
┌─────────────────────────────────────────────────┐
│ Scratcher - Recent Changes                     │
│                                        [Refresh]│
├─────────────────────────────────────────────────┤
│ ℹ️ DevHub Detected                             │
│ You have 2 active scratch org(s)               │
│ This component shows changes from all orgs     │
├─────────────────────────────────────────────────┤
│ Showing 5 recent changes                       │
│ • Source: External Service (Multi-Org)         │
│                                                 │
│ Scratch Org    | Type       | Name             │
│ roaster company| ApexClass  | scratcher        │
│ roaster company| ApexClass  | Monitoring...    │
│ ...                                             │
└─────────────────────────────────────────────────┘
```

## 🐛 Troubleshooting

### Railway deployment failed?
- Check logs in Railway dashboard → Deployments → Latest
- Common issue: Missing `package.json` (should be there)

### Database not initialized?
```bash
railway run node scripts/setup-database.js
```

### API not responding?
- Check Railway logs
- Verify environment variables are set
- Make sure service is running (Railway dashboard)

### Salesforce showing error?
1. Verify Remote Site Setting URL matches Railway URL
2. Check API key matches in both places
3. Open browser console for detailed errors

### No data showing?
```bash
# Trigger manual poll
curl -X POST -H "X-API-Key: $API_KEY" $URL/api/poll

# Wait 10 seconds
sleep 10

# Check again
curl -H "X-API-Key: $API_KEY" $URL/api/changes
```

## 📊 Monitor Your Deployment

### View Logs
Railway dashboard → Click your service → Deployments → Latest → View logs

### Check Database
```bash
railway connect postgres
\dt
SELECT COUNT(*) FROM source_changes;
```

### Monitor Usage
Railway dashboard → Metrics tab
- See CPU, Memory, Network
- Track your $5 monthly credit

## 💰 Cost

- **Railway**: $5/month credit (FREE)
- **Our usage**: ~$2-3/month
- **Remaining**: ~$2-3/month for other projects
- **Total**: **$0/month**

## 🎉 Success!

Once deployed, your system will:
- ✅ Poll all scratch orgs every 5 minutes
- ✅ Store changes in PostgreSQL
- ✅ Display in DevHub component
- ✅ Auto-deploy on git push
- ✅ Never sleep (always available)

**Congratulations! You now have FREE multi-org source tracking!** 🚀

---

## Quick Commands Reference

```bash
# View logs
railway logs

# Connect to database
railway connect postgres

# Run manual poll
railway run node scripts/poll-orgs.js

# Update environment variable
railway variables set POLL_INTERVAL_MINUTES=2

# Redeploy
git push origin main
```

## Need Help?

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **This Project**: See `README.md` and `RAILWAY_DEPLOY.md`
