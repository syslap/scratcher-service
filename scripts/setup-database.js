#!/usr/bin/env node

require('dotenv').config();
const db = require('../lib/database');

async function setup() {
  console.log('🔧 Setting up database...');
  
  try {
    await db.testConnection();
    console.log('✅ Database connection successful');
    
    await db.initializeSchema();
    console.log('✅ Database schema created');
    
    console.log('\n✨ Database setup complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Setup failed:', err);
    process.exit(1);
  }
}

setup();
