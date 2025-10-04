const salesforce = require('./salesforce');
const db = require('./database');
const { execSync } = require('child_process');

// Poll all scratch orgs and update database
async function pollAllOrgs() {
  console.log('🔄 Starting org polling...');
  
  try {
    // Get active scratch orgs from DevHub
    const scratchOrgs = await salesforce.getActiveScratchOrgsFromDevHub();
    console.log(`📦 Found ${scratchOrgs.length} active scratch org(s)`);
    
    for (const org of scratchOrgs) {
      try {
        await pollSingleOrg(org);
      } catch (err) {
        console.error(`❌ Error polling org ${org.username}:`, err.message);
      }
    }
    
    console.log('✅ Polling complete');
  } catch (err) {
    console.error('❌ Polling failed:', err);
    throw err;
  }
}

// Poll a single scratch org
async function pollSingleOrg(orgInfo) {
  console.log(`  📦 Polling: ${orgInfo.username}`);
  
  // Get access token using Salesforce CLI
  let accessToken, instanceUrl;
  
  try {
    const orgDisplayOutput = execSync(
      `sf org display --target-org ${orgInfo.username} --json`,
      { encoding: 'utf-8' }
    );
    
    const orgDisplay = JSON.parse(orgDisplayOutput);
    
    if (orgDisplay.result) {
      accessToken = orgDisplay.result.accessToken;
      instanceUrl = orgDisplay.result.instanceUrl;
    } else {
      throw new Error('Could not get org credentials');
    }
  } catch (err) {
    console.log(`  ⚠️  Could not authenticate to ${orgInfo.username}`);
    return;
  }
  
  // Upsert org in database
  const dbOrgId = await db.upsertScratchOrg({
    orgId: orgInfo.orgId,
    orgName: orgInfo.orgName,
    username: orgInfo.username,
    alias: null,
    instanceUrl: instanceUrl,
    accessToken: accessToken,
    refreshToken: null,
    status: orgInfo.status,
    createdDate: orgInfo.createdDate,
    expirationDate: orgInfo.expirationDate
  });
  
  // Connect and query changes
  try {
    const conn = await salesforce.connectToScratchOrg(
      orgInfo.username,
      accessToken,
      instanceUrl
    );
    
    const maxChanges = parseInt(process.env.MAX_CHANGES_PER_ORG) || 50;
    const changes = await salesforce.queryMetadataChanges(conn, maxChanges);
    
    console.log(`  ✅ Found ${changes.length} change(s)`);
    
    // Insert changes into database
    if (changes.length > 0) {
      const dbChanges = changes.map(change => ({
        scratchOrgId: dbOrgId,
        changeId: change.changeId,
        memberType: change.memberType,
        memberName: change.memberName,
        revisionNum: change.revisionNum,
        changedBy: change.changedBy,
        lastModifiedDate: change.lastModifiedDate
      }));
      
      await db.insertSourceChanges(dbChanges);
    }
    
    // Update last polled timestamp
    await db.updateOrgLastPolled(dbOrgId);
    
  } catch (err) {
    console.log(`  ⚠️  Could not query changes: ${err.message}`);
  }
}

module.exports = {
  pollAllOrgs,
  pollSingleOrg
};
