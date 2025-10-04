# Free Hosting Options Comparison

## 🏆 Recommended: Railway.app

**Best overall free option** - Modern, generous free tier, no credit card required.

### Pros
- ✅ **$5/month credit** (our app uses ~$2-3)
- ✅ **Free PostgreSQL** included
- ✅ **No credit card** required
- ✅ **Never sleeps** - always available
- ✅ **Auto-deploy** from GitHub
- ✅ **Modern dashboard** - great UX
- ✅ **Fast deploys** (~30 seconds)
- ✅ **Easy setup** - 10 minutes total

### Cons
- ⚠️ Credit resets monthly (not rollover)
- ⚠️ Newer platform (less mature than Heroku)

### Deploy Guide
See: `RAILWAY_DEPLOY.md`

---

## 🥈 Alternative 1: Render.com

**Great Heroku alternative** - Similar to Heroku but with free tier.

### Pros
- ✅ **Free tier** - 750 hours/month
- ✅ **Free PostgreSQL** - 90 days, then $7/month
- ✅ **No credit card** for free tier
- ✅ **Auto-deploy** from GitHub
- ✅ **Similar to Heroku** - easy migration

### Cons
- ⚠️ **Spins down after 15min** of inactivity
- ⚠️ **Cold starts** - 30-60 second delay
- ⚠️ **PostgreSQL** only free for 90 days
- ⚠️ **Slower** than Railway

### Quick Deploy

1. **Sign up**: [render.com](https://render.com)

2. **Create Blueprint**:
   - Click "New" → "Blueprint"
   - Connect GitHub repo
   - Render reads `render.yaml` automatically

3. **Configure**:
   - Set environment variables in dashboard
   - Database auto-created from `render.yaml`

4. **Deploy**:
   - Automatic from `render.yaml`
   - Get URL: `scratcher-aggregator.onrender.com`

### Cost
- **Free**: 750 hours/month
- **PostgreSQL**: Free for 90 days, then $7/month
- **Total**: Free for 90 days, then $7/month

---

## 🥉 Alternative 2: Fly.io

**Developer-friendly** - Great for Docker, generous free tier.

### Pros
- ✅ **Free tier** - 3 shared VMs
- ✅ **Free PostgreSQL** - 3GB storage
- ✅ **No sleep** - always on
- ✅ **Global deployment** - edge locations
- ✅ **Docker-based** - flexible

### Cons
- ⚠️ **Credit card required** (won't charge on free tier)
- ⚠️ **More complex** - Docker knowledge helpful
- ⚠️ **CLI required** - no web deploy

### Quick Deploy

1. **Install CLI**:
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Sign up**:
```bash
fly auth signup
```

3. **Launch app**:
```bash
cd external-service
fly launch
# Follow prompts, select region
```

4. **Add PostgreSQL**:
```bash
fly postgres create
fly postgres attach scratcher-db
```

5. **Set secrets**:
```bash
fly secrets set SF_USERNAME=your-devhub@example.com
fly secrets set SF_PASSWORD=your-password
fly secrets set SF_SECURITY_TOKEN=your-token
fly secrets set API_KEY=$(openssl rand -hex 32)
fly secrets set CORS_ORIGIN=https://your-org.my.salesforce.com
```

6. **Deploy**:
```bash
fly deploy
```

### Cost
- **Free**: 3 shared VMs, 3GB PostgreSQL
- **Our usage**: Well within free tier
- **Total**: FREE

---

## 🎯 Alternative 3: Vercel (Serverless)

**Serverless option** - Different architecture, requires code changes.

### Pros
- ✅ **100% Free** for hobby projects
- ✅ **No credit card** required
- ✅ **Instant deploys**
- ✅ **Auto-scaling**
- ✅ **Edge network** - fast globally

### Cons
- ⚠️ **Serverless** - requires code refactoring
- ⚠️ **No cron jobs** - need external scheduler
- ⚠️ **No PostgreSQL** - need external DB
- ⚠️ **10-second timeout** - might be tight for polling

### Would Require
- Convert Express to serverless functions
- Use external cron service (GitHub Actions)
- Use external PostgreSQL (Supabase, Neon)

**Not recommended** for this use case due to complexity.

---

## 🎯 Alternative 4: Supabase (Backend-as-a-Service)

**All-in-one** - Database + Functions + Auth.

### Pros
- ✅ **Free PostgreSQL** - 500MB
- ✅ **Edge Functions** - Deno runtime
- ✅ **No credit card** required
- ✅ **Great dashboard**

### Cons
- ⚠️ **Deno, not Node.js** - requires rewrite
- ⚠️ **No cron** - need external scheduler
- ⚠️ **Different paradigm** - not traditional server

**Not recommended** - too much refactoring needed.

---

## 📊 Comparison Table

| Feature | Railway | Render | Fly.io | Vercel | Supabase |
|---------|---------|--------|--------|--------|----------|
| **Free Tier** | $5 credit/mo | 750 hrs/mo | 3 VMs | Unlimited | 500MB DB |
| **PostgreSQL** | ✅ Free | 90 days free | ✅ Free | ❌ External | ✅ Free |
| **Credit Card** | ❌ Not needed | ❌ Not needed | ⚠️ Required | ❌ Not needed | ❌ Not needed |
| **Sleep Mode** | ❌ Never | ✅ After 15min | ❌ Never | N/A | N/A |
| **Deploy Speed** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Ease of Use** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Code Changes** | ✅ None | ✅ None | ✅ None | ❌ Major | ❌ Major |
| **Cron Jobs** | ✅ Built-in | ✅ Built-in | ✅ Built-in | ❌ External | ❌ External |
| **Best For** | This project! | Heroku users | Docker fans | Static sites | BaaS projects |

---

## 🏆 Final Recommendation

### For This Project: **Railway.app**

**Why?**
1. ✅ **Zero code changes** - works as-is
2. ✅ **Completely free** - $5 credit covers our ~$2 usage
3. ✅ **No credit card** - sign up with GitHub
4. ✅ **No sleep mode** - always available
5. ✅ **Easy setup** - 10 minutes total
6. ✅ **Great DX** - modern dashboard, instant logs
7. ✅ **Auto-deploy** - push to GitHub = deploy

### Setup Time
- **Railway**: 10 minutes ⭐
- **Render**: 15 minutes
- **Fly.io**: 20 minutes
- **Vercel**: 2+ hours (refactoring)
- **Supabase**: 2+ hours (refactoring)

### Monthly Cost
- **Railway**: $0 (within $5 credit)
- **Render**: $0 for 90 days, then $7
- **Fly.io**: $0
- **Vercel**: $0 (but need external DB)
- **Supabase**: $0 (limited features)

---

## 🚀 Quick Start with Railway

```bash
# 1. Push to GitHub
cd external-service
git init
git add .
git commit -m "Initial commit"
git push

# 2. Deploy on Railway
# - Go to railway.app
# - Sign in with GitHub
# - Click "Deploy from GitHub repo"
# - Select your repo
# - Add PostgreSQL database
# - Set environment variables
# - Done! 🎉

# 3. Get your URL
# Railway dashboard → Settings → Generate Domain

# 4. Configure Salesforce
# - Add Remote Site Setting
# - Update ScratcherExternalService.cls
# - Deploy to Salesforce

# 5. Test
curl https://your-app.up.railway.app/health
```

**Total time: 10 minutes**
**Total cost: $0/month**

---

## 📚 Deployment Guides

- **Railway** (Recommended): `RAILWAY_DEPLOY.md`
- **Render**: Use `render.yaml` + Render dashboard
- **Fly.io**: Use Fly CLI
- **Heroku** (Paid): `README.md` (original guide)

---

## 💡 Pro Tips

### For Railway
- Enable auto-deploy: Settings → "Deploy on Push"
- Monitor usage: Metrics tab
- View logs: Deployments → Latest → Logs

### For Render
- Prevent sleep: Use UptimeRobot to ping every 10 minutes
- Database: Upgrade to paid after 90 days ($7/month)

### For Fly.io
- Use `fly scale count 1` to ensure always-on
- Monitor with `fly status`
- Logs with `fly logs`

---

## 🎉 Conclusion

**Use Railway.app** - it's the perfect balance of:
- Free (within $5 monthly credit)
- Easy (10-minute setup)
- Reliable (no sleep mode)
- Modern (great developer experience)

Follow `RAILWAY_DEPLOY.md` to get started!
