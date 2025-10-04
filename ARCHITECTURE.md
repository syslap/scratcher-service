# System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER                                    │
│                    (DevHub Browser)                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Views Component
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SALESFORCE DEVHUB                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Scratcher LWC Component                                 │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  scratcher.js                                      │  │  │
│  │  │  - Detects if DevHub                               │  │  │
│  │  │  - Calls ScratcherExternalService.cls              │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ScratcherExternalService.cls                            │  │
│  │  - Makes HTTP callout to external service                │  │
│  │  - Authenticates with API key                            │  │
│  │  - Transforms response for LWC                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS + API Key
                             │ GET /api/changes
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    HEROKU (External Service)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Express Server (server.js)                              │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  API Routes (routes/api.js)                        │  │  │
│  │  │  - GET  /api/changes    (all orgs)                 │  │  │
│  │  │  - GET  /api/orgs       (org list)                 │  │  │
│  │  │  - POST /api/poll       (trigger)                  │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Cron Job (node-cron)                                    │  │
│  │  - Runs every 5 minutes                                  │  │
│  │  - Calls pollAllOrgs()                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Poll Logic (lib/poll-orgs.js)                           │  │
│  │  1. Query DevHub for active scratch orgs                 │  │
│  │  2. For each org:                                        │  │
│  │     - Get credentials via SF CLI                         │  │
│  │     - Connect to org                                     │  │
│  │     - Query metadata changes                             │  │
│  │     - Store in database                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                                     │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  scratch_orgs                                      │  │  │
│  │  │  - org_id, username, access_token, etc.            │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  source_changes                                    │  │  │
│  │  │  - member_type, member_name, changed_by, etc.      │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ SF CLI + OAuth
                             │ Queries metadata
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SCRATCH ORGS (Multiple)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Scratch 1   │  │  Scratch 2   │  │  Scratch N   │          │
│  │  ApexClass   │  │  ApexClass   │  │  ApexClass   │          │
│  │  ApexTrigger │  │  ApexTrigger │  │  ApexTrigger │          │
│  │  ApexPage    │  │  ApexPage    │  │  ApexPage    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Polling Flow (Automated - Every 5 Minutes)

```
┌─────────────┐
│  Cron Job   │
│  (Heroku)   │
└──────┬──────┘
       │
       │ Triggers
       ▼
┌─────────────────────┐
│  pollAllOrgs()      │
│  (poll-orgs.js)     │
└──────┬──────────────┘
       │
       │ 1. Query DevHub
       ▼
┌─────────────────────────────┐
│  Salesforce DevHub          │
│  SELECT * FROM              │
│  ActiveScratchOrg           │
│  WHERE Status = 'Active'    │
└──────┬──────────────────────┘
       │
       │ Returns: [Org1, Org2, Org3]
       ▼
┌─────────────────────────────┐
│  For Each Scratch Org:      │
│  ┌─────────────────────┐    │
│  │ 1. Get credentials  │    │
│  │    (SF CLI)         │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ 2. Connect to org   │    │
│  │    (jsforce)        │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ 3. Query metadata   │    │
│  │    (ApexClass, etc) │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ 4. Save to DB       │    │
│  │    (PostgreSQL)     │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

### 2. API Request Flow (User Initiated)

```
┌─────────────┐
│  User       │
│  (Browser)  │
└──────┬──────┘
       │
       │ Views Scratcher Component
       ▼
┌─────────────────────────────┐
│  Scratcher LWC              │
│  connectedCallback()        │
└──────┬──────────────────────┘
       │
       │ Calls Apex
       ▼
┌─────────────────────────────────────┐
│  ScratcherExternalService.cls       │
│  getChangesFromExternalService()    │
└──────┬──────────────────────────────┘
       │
       │ HTTP GET
       │ X-API-Key: xxx
       ▼
┌─────────────────────────────────────┐
│  Heroku API                         │
│  GET /api/changes?limit=100         │
└──────┬──────────────────────────────┘
       │
       │ Query Database
       ▼
┌─────────────────────────────────────┐
│  PostgreSQL                         │
│  SELECT * FROM source_changes       │
│  JOIN scratch_orgs                  │
│  ORDER BY last_modified_date DESC   │
└──────┬──────────────────────────────┘
       │
       │ Returns JSON
       ▼
┌─────────────────────────────────────┐
│  {                                  │
│    "success": true,                 │
│    "changes": [...]                 │
│  }                                  │
└──────┬──────────────────────────────┘
       │
       │ Transform & Display
       ▼
┌─────────────────────────────────────┐
│  Scratcher LWC                      │
│  <lightning-datatable>              │
│  Shows all changes from all orgs    │
└─────────────────────────────────────┘
```

## Component Breakdown

### External Service Components

```
external-service/
├── server.js                 # Main Express server
├── lib/
│   ├── database.js          # PostgreSQL queries
│   ├── salesforce.js        # SF authentication & queries
│   └── poll-orgs.js         # Polling logic
├── routes/
│   └── api.js               # REST API endpoints
└── scripts/
    ├── setup-database.js    # DB initialization
    └── poll-orgs.js         # Manual poll script
```

### Salesforce Components

```
force-app/main/default/
├── classes/
│   ├── scratcher.cls                    # Local fallback
│   └── ScratcherExternalService.cls     # External API client
└── lwc/scratcher/
    ├── scratcher.html                   # UI template
    ├── scratcher.js                     # Component logic
    └── scratcher.css                    # Styling
```

## Database Schema

### scratch_orgs Table

```sql
CREATE TABLE scratch_orgs (
  id SERIAL PRIMARY KEY,
  org_id VARCHAR(18) UNIQUE NOT NULL,
  org_name VARCHAR(255),
  username VARCHAR(255) NOT NULL,
  alias VARCHAR(255),
  instance_url TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  status VARCHAR(50) DEFAULT 'Active',
  created_date TIMESTAMP,
  expiration_date DATE,
  last_polled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### source_changes Table

```sql
CREATE TABLE source_changes (
  id SERIAL PRIMARY KEY,
  scratch_org_id INTEGER REFERENCES scratch_orgs(id),
  change_id VARCHAR(18),
  member_type VARCHAR(100) NOT NULL,
  member_name VARCHAR(255) NOT NULL,
  revision_num INTEGER DEFAULT 1,
  changed_by VARCHAR(255),
  last_modified_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(scratch_org_id, change_id, member_name)
);
```

## Security Architecture

```
┌─────────────────────────────────────────┐
│  Salesforce (LWC)                       │
│  - Stores API Key in Apex               │
│  - Uses Remote Site Setting             │
└────────────┬────────────────────────────┘
             │
             │ HTTPS Only
             │ X-API-Key Header
             ▼
┌─────────────────────────────────────────┐
│  Heroku (External Service)              │
│  ┌───────────────────────────────────┐  │
│  │  API Key Middleware               │  │
│  │  - Validates X-API-Key header     │  │
│  │  - Returns 401 if invalid         │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  CORS Middleware                  │  │
│  │  - Restricts to specific origin   │  │
│  │  - Blocks unauthorized domains    │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Helmet.js                        │  │
│  │  - Security headers               │  │
│  │  - XSS protection                 │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Scaling Considerations

### Current Capacity
- **Scratch Orgs**: Up to 100 orgs
- **Changes per Org**: 50 per poll
- **Total Changes**: ~5,000 per poll
- **Polling Frequency**: Every 5 minutes
- **Database**: PostgreSQL (unlimited rows)

### Scaling Options

**Increase Polling Frequency:**
```bash
heroku config:set POLL_INTERVAL_MINUTES=1
```

**Increase Changes per Org:**
```bash
heroku config:set MAX_CHANGES_PER_ORG=100
```

**Upgrade Database:**
```bash
heroku addons:upgrade heroku-postgresql:basic
```

**Add More Dynos:**
```bash
heroku ps:scale web=2
```

## Monitoring & Observability

```
┌─────────────────────────────────────────┐
│  Heroku Logs                            │
│  - Application logs                     │
│  - Error tracking                       │
│  - Performance metrics                  │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  PostgreSQL Logs                        │
│  - Query performance                    │
│  - Connection pool stats                │
│  - Database size                        │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Salesforce Debug Logs                  │
│  - API callout logs                     │
│  - LWC console logs                     │
│  - Apex execution logs                  │
└─────────────────────────────────────────┘
```

## Failure Modes & Recovery

### Scenario 1: External Service Down
- **Impact**: LWC shows error message
- **Fallback**: Component can use local `scratcher.cls`
- **Recovery**: Automatic when service restarts

### Scenario 2: Database Connection Lost
- **Impact**: API returns errors
- **Recovery**: Heroku auto-restarts dyno
- **Data**: No data loss (PostgreSQL persists)

### Scenario 3: Scratch Org Expired
- **Impact**: Polling skips expired org
- **Recovery**: Automatic (status updated in DB)
- **Cleanup**: Manual or scheduled job

### Scenario 4: Invalid Credentials
- **Impact**: Polling fails for that org
- **Recovery**: Update credentials in Heroku config
- **Logging**: Error logged to Heroku logs

## Performance Characteristics

### API Response Times
- **GET /api/changes**: ~100-300ms
- **GET /api/orgs**: ~50-100ms
- **POST /api/poll**: ~5-30s (async)

### Polling Duration
- **Per Org**: ~2-5 seconds
- **10 Orgs**: ~20-50 seconds
- **Parallel**: Not implemented (sequential)

### Database Queries
- **Indexed**: Yes (org_id, last_modified_date)
- **Query Time**: <50ms for 10,000 rows
- **Connection Pool**: 10 connections

## Future Enhancements

### Phase 2
- [ ] OAuth 2.0 JWT flow
- [ ] Named Credentials
- [ ] Custom Metadata configuration
- [ ] Parallel polling

### Phase 3
- [ ] Platform Events integration
- [ ] Real-time updates
- [ ] WebSocket support
- [ ] Change notifications

### Phase 4
- [ ] Historical trending
- [ ] Analytics dashboard
- [ ] Export functionality
- [ ] Team collaboration features
