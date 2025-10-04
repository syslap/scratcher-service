# Scratcher External Service

External Node.js service that aggregates Salesforce scratch org changes across multiple orgs and exposes them via REST API.

## Architecture

```
┌─────────────────┐
│   DevHub Org    │
│   (Salesforce)  │
└────────┬────────┘
         │
         │ Queries ActiveScratchOrg
         ▼
┌─────────────────────────────────┐
│  External Service (Heroku)      │
│  - Node.js/Express              │
│  - PostgreSQL Database          │
│  - Scheduled Polling (Cron)     │
└────────┬────────────────────────┘
         │
         │ Authenticates & Queries
         ▼
┌────────────────────────────────────┐
│  Scratch Orgs (Multiple)           │
│  - Org 1: ApexClass, Triggers...   │
│  - Org 2: ApexClass, Triggers...   │
│  - Org N: ApexClass, Triggers...   │
└────────────────────────────────────┘
         │
         │ Aggregated Data
         ▼
┌────────────────────────────────┐
│  LWC Component                 │
│  (Displays in DevHub)          │
└────────────────────────────────┘
```

## Features

- ✅ **Automatic Polling**: Polls all active scratch orgs every 5 minutes
- ✅ **Multi-Org Aggregation**: Combines changes from all scratch orgs
- ✅ **REST API**: Exposes endpoints for LWC to consume
- ✅ **PostgreSQL Storage**: Persists changes for historical tracking
- ✅ **Secure**: API key authentication
- ✅ **Heroku Ready**: One-click deployment

## Prerequisites

- Node.js 18.x or higher
- PostgreSQL 12+ (or Heroku Postgres)
- Salesforce CLI (`sf`)
- Salesforce DevHub with active scratch orgs
- Salesforce Connected App (for OAuth)

## Local Development Setup

### 1. Install Dependencies

```bash
cd external-service
npm install
```

### 2. Set Up PostgreSQL

```bash
# Install PostgreSQL (Mac)
brew install postgresql@14
brew services start postgresql@14

# Create database
createdb scratcher_dev
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://localhost:5432/scratcher_dev

# Salesforce DevHub
SF_LOGIN_URL=https://login.salesforce.com
SF_USERNAME=your-devhub-username@example.com
SF_PASSWORD=your-password
SF_SECURITY_TOKEN=your-security-token

# API Security
API_KEY=generate-a-secure-random-key-here
CORS_ORIGIN=https://your-org.my.salesforce.com

# Polling
POLL_INTERVAL_MINUTES=5
MAX_CHANGES_PER_ORG=50
```

### 4. Initialize Database

```bash
npm run setup-db
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 6. Test the API

```bash
# Health check
curl http://localhost:3000/health

# Get changes (requires API key)
curl -H "X-API-Key: your-api-key" http://localhost:3000/api/changes

# Get scratch orgs
curl -H "X-API-Key: your-api-key" http://localhost:3000/api/orgs

# Trigger manual poll
curl -X POST -H "X-API-Key: your-api-key" http://localhost:3000/api/poll
```

## 🆓 FREE Hosting Options

**Recommended: Railway.app** - 100% free with $5/month credit (our app uses ~$2)

See detailed guides:
- **Railway.app** (Recommended): [`RAILWAY_DEPLOY.md`](RAILWAY_DEPLOY.md) - 10 minutes, $0/month
- **Render.com**: Use `render.yaml` - 15 minutes, free for 90 days
- **Fly.io**: CLI-based - 20 minutes, $0/month
- **Comparison**: [`FREE_HOSTING_OPTIONS.md`](FREE_HOSTING_OPTIONS.md)

## Heroku Deployment (Paid - $5/month)

### 1. Create Heroku App

```bash
# Install Heroku CLI
brew install heroku/brew/heroku

# Login
heroku login

# Create app
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini
```

### 2. Configure Environment Variables

```bash
heroku config:set SF_LOGIN_URL=https://login.salesforce.com
heroku config:set SF_USERNAME=your-devhub-username@example.com
heroku config:set SF_PASSWORD=your-password
heroku config:set SF_SECURITY_TOKEN=your-token
heroku config:set API_KEY=$(openssl rand -hex 32)
heroku config:set CORS_ORIGIN=https://your-org.my.salesforce.com
heroku config:set POLL_INTERVAL_MINUTES=5
heroku config:set MAX_CHANGES_PER_ORG=50
heroku config:set NODE_ENV=production
```

### 3. Deploy

```bash
git add .
git commit -m "Deploy scratcher service"
git push heroku main
```

### 4. Verify Deployment

```bash
# Check logs
heroku logs --tail

# Test health endpoint
curl https://your-app-name.herokuapp.com/health

# Test API
curl -H "X-API-Key: your-api-key" https://your-app-name.herokuapp.com/api/changes
```

## Salesforce Configuration

### 1. Create Remote Site Setting

In Salesforce Setup:
1. Go to **Setup** → **Security** → **Remote Site Settings**
2. Click **New Remote Site**
3. Name: `Scratcher_External_Service`
4. URL: `https://your-app-name.herokuapp.com`
5. Click **Save**

### 2. Update Apex Class

Edit `ScratcherExternalService.cls`:

```apex
private static String getServiceUrl() {
    return 'https://your-app-name.herokuapp.com';
}

private static String getApiKey() {
    return 'your-api-key-from-heroku';
}
```

**Better approach**: Create Custom Metadata Type to store these values securely.

### 3. Deploy Updated LWC

```bash
sf project deploy start --source-dir force-app
```

### 4. Test in Salesforce

1. Open your DevHub org
2. Navigate to the Scratcher page
3. You should see changes from all scratch orgs!

## API Endpoints

### GET /health
Health check endpoint (no auth required)

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-04T01:30:00.000Z",
  "version": "1.0.0"
}
```

### GET /api/changes
Get recent changes across all scratch orgs

**Headers:**
- `X-API-Key`: Your API key

**Query Parameters:**
- `limit` (optional): Max number of changes (default: 100)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "changes": [
    {
      "id": "01pKF00000JvwkTYAR",
      "memberType": "ApexClass",
      "memberName": "scratcher",
      "revisionNum": 1,
      "changedBy": "User User",
      "lastModifiedDate": "2025-10-04T01:26:13.000Z",
      "scratchOrgId": "00DKF0000007nuU2AQ",
      "scratchOrgName": "roaster company",
      "scratchOrgAlias": "Roaster",
      "scratchOrgUsername": "test-kjsy1ffxv0np@example.com"
    }
  ]
}
```

### GET /api/changes/:orgId
Get changes for a specific scratch org

**Headers:**
- `X-API-Key`: Your API key

**Parameters:**
- `orgId`: Salesforce org ID (15 or 18 characters)

**Query Parameters:**
- `limit` (optional): Max number of changes (default: 50)

### GET /api/orgs
Get all tracked scratch orgs

**Headers:**
- `X-API-Key`: Your API key

**Response:**
```json
{
  "success": true,
  "count": 2,
  "orgs": [
    {
      "id": "00DKF0000007nuU2AQ",
      "name": "roaster company",
      "username": "test-kjsy1ffxv0np@example.com",
      "alias": "Roaster",
      "status": "Active",
      "createdDate": "2025-10-04T00:34:44.000Z",
      "expirationDate": "2025-10-11",
      "lastPolledAt": "2025-10-04T01:30:00.000Z"
    }
  ]
}
```

### POST /api/poll
Trigger manual poll of all scratch orgs

**Headers:**
- `X-API-Key`: Your API key

**Response:**
```json
{
  "success": true,
  "message": "Polling started"
}
```

## Database Schema

### scratch_orgs
Stores scratch org metadata and credentials

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| org_id | VARCHAR(18) | Salesforce org ID (unique) |
| org_name | VARCHAR(255) | Org name |
| username | VARCHAR(255) | Login username |
| alias | VARCHAR(255) | Org alias |
| instance_url | TEXT | Instance URL |
| access_token | TEXT | OAuth access token |
| refresh_token | TEXT | OAuth refresh token |
| status | VARCHAR(50) | Active/Expired |
| created_date | TIMESTAMP | When org was created |
| expiration_date | DATE | When org expires |
| last_polled_at | TIMESTAMP | Last poll timestamp |

### source_changes
Stores metadata changes from scratch orgs

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| scratch_org_id | INTEGER | FK to scratch_orgs |
| change_id | VARCHAR(18) | Salesforce record ID |
| member_type | VARCHAR(100) | ApexClass, ApexTrigger, etc. |
| member_name | VARCHAR(255) | Component name |
| revision_num | INTEGER | Revision number |
| changed_by | VARCHAR(255) | User who made change |
| last_modified_date | TIMESTAMP | When changed |

## Troubleshooting

### Polling Not Working

Check logs:
```bash
heroku logs --tail
```

Common issues:
- **Invalid credentials**: Verify SF_USERNAME, SF_PASSWORD, SF_SECURITY_TOKEN
- **Expired scratch orgs**: Check org expiration dates
- **Network issues**: Verify Heroku can reach Salesforce

### LWC Not Showing Data

1. Check Remote Site Settings in Salesforce
2. Verify API_KEY matches in both places
3. Check browser console for errors
4. Test API endpoint directly with curl

### Database Connection Issues

```bash
# Check database URL
heroku config:get DATABASE_URL

# Connect to database
heroku pg:psql

# Check tables
\dt
```

## Security Best Practices

1. **Never commit `.env`** - It's in `.gitignore`
2. **Use strong API keys** - Generate with `openssl rand -hex 32`
3. **Rotate credentials** - Change API keys periodically
4. **Use Custom Metadata** - Store API key in Salesforce Custom Metadata, not hardcoded
5. **Enable HTTPS only** - Heroku provides this by default
6. **Limit CORS** - Set specific CORS_ORIGIN, not `*`

## Monitoring

### Heroku Metrics

```bash
# View app metrics
heroku metrics

# View database metrics
heroku pg:info
```

### Application Logs

```bash
# Tail logs
heroku logs --tail

# Search logs
heroku logs --source app | grep ERROR
```

## Scaling

### Increase Polling Frequency

```bash
heroku config:set POLL_INTERVAL_MINUTES=2
```

### Upgrade Database

```bash
heroku addons:upgrade heroku-postgresql:basic
```

### Add More Dynos

```bash
heroku ps:scale web=2
```

## License

MIT
