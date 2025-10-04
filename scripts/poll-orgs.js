#!/usr/bin/env node

/**
 * Manual script to poll all scratch orgs
 * Usage: node scripts/poll-orgs.js
 */

require('dotenv').config();
const pollOrgs = require('../lib/poll-orgs');

async function main() {
  console.log('🔄 Starting manual poll...\n');
  
  try {
    await pollOrgs.pollAllOrgs();
    console.log('\n✅ Poll completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Poll failed:', err);
    process.exit(1);
  }
}

main();
