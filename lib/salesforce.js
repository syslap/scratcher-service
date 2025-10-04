const jsforce = require('jsforce');

// Connect to DevHub
async function connectToDevHub() {
  const conn = new jsforce.Connection({
    loginUrl: process.env.SF_LOGIN_URL || 'https://login.salesforce.com'
  });
  
  await conn.login(
    process.env.SF_USERNAME,
    process.env.SF_PASSWORD + (process.env.SF_SECURITY_TOKEN || '')
  );
  
  return conn;
}

// Get all active scratch orgs from DevHub
async function getActiveScratchOrgsFromDevHub() {
  const conn = await connectToDevHub();
  
  const result = await conn.query(`
    SELECT Id, ScratchOrg, OrgName, SignupUsername, 
           CreatedDate, ExpirationDate, Status
    FROM ActiveScratchOrg
    WHERE Status = 'Active'
    ORDER BY CreatedDate DESC
  `);
  
  return result.records.map(record => ({
    id: record.Id,
    orgId: record.ScratchOrg,
    orgName: record.OrgName,
    username: record.SignupUsername,
    createdDate: record.CreatedDate,
    expirationDate: record.ExpirationDate,
    status: record.Status
  }));
}

// Connect to a scratch org using JWT or username/password
async function connectToScratchOrg(username, accessToken, instanceUrl) {
  const conn = new jsforce.Connection({
    instanceUrl: instanceUrl,
    accessToken: accessToken
  });
  
  // Test connection
  try {
    await conn.identity();
    return conn;
  } catch (err) {
    // If access token expired, we'd need to re-authenticate
    // For now, throw error
    throw new Error(`Failed to connect to scratch org ${username}: ${err.message}`);
  }
}

// Query metadata changes from a scratch org
async function queryMetadataChanges(conn, limit = 50) {
  const changes = [];
  
  // Try SourceMember first (legacy)
  try {
    const result = await conn.query(`
      SELECT Id, MemberType, MemberName, RevisionNum, 
             ChangedBy, LastModifiedDate
      FROM SourceMember
      WHERE IsNameObsolete = false
      ORDER BY LastModifiedDate DESC
      LIMIT ${limit}
    `);
    
    return result.records.map(record => ({
      changeId: record.Id,
      memberType: record.MemberType,
      memberName: record.MemberName,
      revisionNum: record.RevisionNum,
      changedBy: record.ChangedBy,
      lastModifiedDate: record.LastModifiedDate
    }));
  } catch (err) {
    console.log('SourceMember not available, trying metadata objects...');
  }
  
  // Fallback to querying metadata objects directly
  const perType = Math.floor(limit / 4);
  
  // Query ApexClass
  try {
    const result = await conn.query(`
      SELECT Id, Name, LastModifiedDate, LastModifiedBy.Name
      FROM ApexClass
      WHERE NamespacePrefix = null
      ORDER BY LastModifiedDate DESC
      LIMIT ${perType}
    `);
    
    result.records.forEach(record => {
      changes.push({
        changeId: record.Id,
        memberType: 'ApexClass',
        memberName: record.Name,
        revisionNum: 1,
        changedBy: record.LastModifiedBy?.Name || 'Unknown',
        lastModifiedDate: record.LastModifiedDate
      });
    });
  } catch (err) {
    console.log('Error querying ApexClass:', err.message);
  }
  
  // Query ApexTrigger
  try {
    const result = await conn.query(`
      SELECT Id, Name, LastModifiedDate, LastModifiedBy.Name
      FROM ApexTrigger
      WHERE NamespacePrefix = null
      ORDER BY LastModifiedDate DESC
      LIMIT ${perType}
    `);
    
    result.records.forEach(record => {
      changes.push({
        changeId: record.Id,
        memberType: 'ApexTrigger',
        memberName: record.Name,
        revisionNum: 1,
        changedBy: record.LastModifiedBy?.Name || 'Unknown',
        lastModifiedDate: record.LastModifiedDate
      });
    });
  } catch (err) {
    console.log('Error querying ApexTrigger:', err.message);
  }
  
  // Query ApexPage
  try {
    const result = await conn.query(`
      SELECT Id, Name, LastModifiedDate, LastModifiedBy.Name
      FROM ApexPage
      WHERE NamespacePrefix = null
      ORDER BY LastModifiedDate DESC
      LIMIT ${perType}
    `);
    
    result.records.forEach(record => {
      changes.push({
        changeId: record.Id,
        memberType: 'ApexPage',
        memberName: record.Name,
        revisionNum: 1,
        changedBy: record.LastModifiedBy?.Name || 'Unknown',
        lastModifiedDate: record.LastModifiedDate
      });
    });
  } catch (err) {
    console.log('Error querying ApexPage:', err.message);
  }
  
  // Sort by date and limit
  changes.sort((a, b) => new Date(b.lastModifiedDate) - new Date(a.lastModifiedDate));
  return changes.slice(0, limit);
}

module.exports = {
  connectToDevHub,
  getActiveScratchOrgsFromDevHub,
  connectToScratchOrg,
  queryMetadataChanges
};
