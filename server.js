const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cron = require('node-cron');
require('dotenv').config();

const db = require('./lib/database');
const pollOrgs = require('./lib/poll-orgs');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
app.use(express.json());

// API Key authentication middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes (auth required)
app.use('/api', authenticateApiKey, apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Initialize database and start server
async function start() {
  try {
    // Test database connection
    await db.testConnection();
    console.log('✅ Database connected');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Scratcher Aggregator running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔐 API Key authentication: ${process.env.API_KEY ? 'enabled' : 'DISABLED (WARNING!)'}`);
    });
    
    // Schedule polling job
    const pollInterval = process.env.POLL_INTERVAL_MINUTES || 5;
    console.log(`⏰ Scheduling org polling every ${pollInterval} minutes`);
    
    // Run immediately on startup
    pollOrgs.pollAllOrgs().catch(err => {
      console.error('Initial poll failed:', err);
    });
    
    // Then run on schedule
    cron.schedule(`*/${pollInterval} * * * *`, async () => {
      console.log('⏰ Running scheduled poll...');
      try {
        await pollOrgs.pollAllOrgs();
      } catch (err) {
        console.error('Scheduled poll failed:', err);
      }
    });
    
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await db.close();
  process.exit(0);
});

start();
