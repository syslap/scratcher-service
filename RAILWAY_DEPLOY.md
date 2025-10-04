# Deploy to Railway.app (100% FREE!)

Railway.app offers a generous free tier with **$5 credit per month** - more than enough for this service!

## Why Railway?

- ✅ **100% Free** - $5/month credit (our app uses ~$2-3/month)
- ✅ **Easier than Heroku** - One-click deploy from GitHub
- ✅ **Free PostgreSQL** - Included in free tier
- ✅ **No credit card required** - Sign up with GitHub
- ✅ **Better DX** - Modern dashboard, instant logs
- ✅ **Auto-deploy** - Push to GitHub = auto deploy

## Quick Deploy (10 Minutes)

### Step 1: Sign Up (2 minutes)

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Sign in with GitHub (no credit card needed!)

### Step 2: Deploy from GitHub (3 minutes)

**Option A: Deploy from this repo**

1. Push your code to GitHub:
```bash
cd external-service
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/scratcher-service.git
git push -u origin main
```

2. In Railway dashboard:
   - Click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose your repository
   - Railway will auto-detect Node.js and deploy!

**Option B: Deploy from template (Fastest)**

1. Click this button: [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)
2. Connect your GitHub account
3. Railway will create a new repo and deploy automatically

### Step 3: Add PostgreSQL (1 minute)

1. In your Railway project dashboard
2. Click **"New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway automatically sets `DATABASE_URL` environment variable!

### Step 4: Configure Environment Variables (3 minutes)

In Railway dashboard, click **"Variables"** tab and add:

```env
SF_LOGIN_URL=https://login.salesforce.com
SF_USERNAME=your-devhub@example.com
SF_PASSWORD=your-password
SF_SECURITY_TOKEN=your-security-token
API_KEY=generate-random-key-here
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

### Step 5: Initialize Database (1 minute)

Railway doesn't have a "release" phase like Heroku, so we need to run the setup manually once:

**Option A: Via Railway CLI**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run database setup
railway run node scripts/setup-database.js
```

**Option B: Via Code (Automatic)**

The server will auto-initialize the database on first startup (already configured in `server.js`).

### Step 6: Get Your URL

1. In Railway dashboard, click **"Settings"** tab
2. Under **"Domains"**, click **"Generate Domain"**
3. You'll get a URL like: `scratcher-production.up.railway.app`

### Step 7: Configure Salesforce (5 minutes)

**A. Add Remote Site Setting:**
1. Salesforce Setup → Security → Remote Site Settings
2. New Remote Site
3. Name: `Scratcher_Railway`
4. URL: `https://scratcher-production.up.railway.app`
5. Save

**B. Update Apex Class:**

Edit `force-app/main/default/classes/ScratcherExternalService.cls`:

```apex
private static String getServiceUrl() {
    return 'https://scratcher-production.up.railway.app';
}

private static String getApiKey() {
    return 'your-api-key-from-railway';
}
```

**C. Deploy to Salesforce:**
```bash
sf project deploy start --source-dir force-app/main/default/classes/ScratcherExternalService.cls
```

### Step 8: Test It! 🎉

```bash
# Get your Railway URL and API key from dashboard
API_KEY="your-api-key"
URL="https://scratcher-production.up.railway.app"

# Test health
curl $URL/health

# Test API
curl -H "X-API-Key: $API_KEY" $URL/api/changes

# Test in Salesforce
# Open DevHub → Scratcher page → See all scratch org changes!
```

## Railway Dashboard Features

### View Logs
1. Click **"Deployments"** tab
2. Click latest deployment
3. See real-time logs!

### Monitor Usage
1. Click **"Metrics"** tab
2. See CPU, Memory, Network usage
3. Track your $5 monthly credit

### Auto-Deploy on Git Push
1. Push to GitHub
2. Railway automatically deploys
3. Zero downtime!

## Cost Breakdown

| Resource | Railway Free Tier | Our Usage |
|----------|-------------------|-----------|
| Compute | $5/month credit | ~$2/month |
| PostgreSQL | Included | Free |
| Bandwidth | 100GB/month | ~1GB/month |
| **Total** | **FREE** | **FREE** |

You get **$5 credit per month** which resets monthly. Our service uses about $2-3/month, so you're well within the free tier!

## Advantages Over Heroku

| Feature | Railway | Heroku |
|---------|---------|--------|
| **Free Tier** | $5/month credit | $0 (removed) |
| **PostgreSQL** | Free | $0 (removed) |
| **Sleep Mode** | Never sleeps | Sleeps after 30min |
| **Deploy Speed** | ~30 seconds | ~2 minutes |
| **Dashboard** | Modern, fast | Older UI |
| **Auto-deploy** | Built-in | Requires setup |
| **CLI** | Optional | Required |

## Troubleshooting

### Database not initialized?

Run manually:
```bash
railway run node scripts/setup-database.js
```

Or check logs - it should auto-initialize on first startup.

### Can't connect to database?

Railway automatically sets `DATABASE_URL`. Check:
```bash
railway variables
```

### Service not starting?

Check logs in Railway dashboard:
1. Click **"Deployments"**
2. Click latest deployment
3. View logs for errors

### Out of credit?

Railway gives you $5/month. If you run out:
- **Upgrade to Hobby plan**: $5/month for $5 credit + extra features
- **Optimize**: Reduce `POLL_INTERVAL_MINUTES` to use less compute

## Railway CLI Commands

```bash
# Install
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# View logs
railway logs

# Run commands
railway run node scripts/poll-orgs.js

# View variables
railway variables

# Open dashboard
railway open
```

## Monitoring

### View Logs
```bash
railway logs --tail
```

### Check Database
```bash
railway connect postgres
\dt
SELECT COUNT(*) FROM source_changes;
```

### Metrics
View in Railway dashboard → **Metrics** tab

## Scaling

### Increase Resources (If Needed)

Railway automatically scales, but you can upgrade:

1. **Hobby Plan**: $5/month
   - More resources
   - Custom domains
   - Priority support

2. **Pro Plan**: $20/month
   - Even more resources
   - Team features
   - SLA

For our use case, **free tier is sufficient**!

## Migration from Heroku

If you already deployed to Heroku:

1. Export Heroku config:
```bash
heroku config --shell > .env
```

2. Import to Railway:
```bash
railway variables set $(cat .env)
```

3. Export Heroku database:
```bash
heroku pg:backups:capture
heroku pg:backups:download
```

4. Import to Railway:
```bash
railway connect postgres
\i latest.dump
```

## Next Steps

- ✅ Service deployed to Railway
- ✅ PostgreSQL database created
- ✅ Environment variables configured
- ✅ Salesforce configured
- ✅ Component working!

**Enjoy your FREE multi-org source tracking!** 🎉

---

**Questions?**
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- This project's README: `README.md`
