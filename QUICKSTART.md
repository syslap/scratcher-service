# Quick Start Guide - 10 Minutes to Multi-Org Source Tracking

This guide will get you up and running with the external service in 10 minutes using **Railway.app** (100% FREE!).

## Prerequisites Checklist

- [ ] GitHub account (for Railway login)
- [ ] Salesforce DevHub with active scratch orgs
- [ ] Salesforce CLI installed (`sf`)

## Step 1: Deploy to Railway (3 minutes) - FREE!

1. **Go to [railway.app](https://railway.app)**
2. **Sign in with GitHub** (no credit card needed!)
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Push your code to GitHub first:**

```bash
cd external-service
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/scratcher-service.git
git push -u origin main
```

6. **Back in Railway:**
   - Select your repository
   - Railway auto-detects Node.js and deploys!

7. **Add PostgreSQL:**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway automatically sets `DATABASE_URL`!

## Step 2: Configure Environment Variables (2 minutes)

In Railway dashboard, click **"Variables"** tab and add:

```env
SF_USERNAME=your-devhub@example.com
SF_PASSWORD=your-password
SF_SECURITY_TOKEN=your-security-token
API_KEY=paste-generated-key-here
CORS_ORIGIN=https://playful-panda-a61dyz-dev-ed.my.salesforce.com
POLL_INTERVAL_MINUTES=5
MAX_CHANGES_PER_ORG=50
NODE_ENV=production
```

**Generate API Key:**
```bash
openssl rand -hex 32
```

## Step 3: Get Your Railway URL (1 minute)

1. In Railway dashboard, click **"Settings"** tab
2. Under **"Domains"**, click **"Generate Domain"**
3. You'll get a URL like: `scratcher-production.up.railway.app`
4. Copy this URL!

## Step 4: Configure Salesforce (3 minutes)

### 4.1 Add Remote Site Setting

1. In Salesforce, go to **Setup** → **Remote Site Settings**
2. Click **New Remote Site**
3. Name: `Scratcher_Railway`
4. URL: `https://scratcher-production.up.railway.app` (your Railway URL)
5. Save

### 4.2 Update Apex Class

Edit `force-app/main/default/classes/ScratcherExternalService.cls`:

```apex
private static String getServiceUrl() {
    return 'https://scratcher-production.up.railway.app';  // Your Railway URL
}

private static String getApiKey() {
    return 'paste-your-api-key-here';  // From Railway Variables tab
}
```

### 4.3 Deploy to Salesforce

```bash
sf project deploy start --source-dir force-app
```

## Step 5: Test It! (1 minute)

### 5.1 Test the API

```bash
# Get your Railway URL and API key from dashboard
API_KEY="your-api-key"
URL="https://scratcher-production.up.railway.app"

# Test health
curl $URL/health

# Test changes endpoint
curl -H "X-API-Key: $API_KEY" $URL/api/changes
```

### 4.2 View in Salesforce

1. Open your DevHub org
2. Go to the Scratcher page
3. You should see changes from ALL your scratch orgs!

## Verify It's Working

You should see:
- ✅ DevHub banner showing "X active scratch orgs"
- ✅ Data table with changes from multiple orgs
- ✅ "Source: External Service (Multi-Org)" indicator

## Troubleshooting

### No data showing?

```bash
# Check logs in Railway dashboard
# Or use Railway CLI:
railway logs

# Trigger manual poll
curl -X POST -H "X-API-Key: $API_KEY" $URL/api/poll

# Wait 10 seconds, then check again
curl -H "X-API-Key: $API_KEY" $URL/api/changes
```

### Error in Salesforce?

1. Check Remote Site Settings is configured
2. Verify API key matches in both places
3. Check browser console for errors

### Still stuck?

Check the full README.md for detailed troubleshooting.

## Next Steps

- Set up monitoring: `heroku logs --tail`
- Adjust polling frequency: `heroku config:set POLL_INTERVAL_MINUTES=2`
- Add more scratch orgs and watch them appear automatically!

## Cost

- **Railway**: $5/month credit (FREE!)
- **Our usage**: ~$2-3/month
- **PostgreSQL**: Included
- **Total**: **$0/month** (within free credit!)

## Why Railway?

- ✅ **100% FREE** - $5 credit covers our usage
- ✅ **No credit card** - sign up with GitHub
- ✅ **Never sleeps** - always available
- ✅ **Easy setup** - 10 minutes total
- ✅ **Auto-deploy** - push to GitHub = deploy

Enjoy your FREE multi-org source tracking! 🎉
