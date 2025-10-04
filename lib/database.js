const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
async function testConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
  } finally {
    client.release();
  }
}

// Initialize database schema
async function initializeSchema() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create scratch_orgs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS scratch_orgs (
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
      )
    `);
    
    // Create source_changes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS source_changes (
        id SERIAL PRIMARY KEY,
        scratch_org_id INTEGER REFERENCES scratch_orgs(id) ON DELETE CASCADE,
        change_id VARCHAR(18),
        member_type VARCHAR(100) NOT NULL,
        member_name VARCHAR(255) NOT NULL,
        revision_num INTEGER DEFAULT 1,
        changed_by VARCHAR(255),
        last_modified_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(scratch_org_id, change_id, member_name)
      )
    `);
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_source_changes_org 
      ON source_changes(scratch_org_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_source_changes_date 
      ON source_changes(last_modified_date DESC)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_scratch_orgs_status 
      ON scratch_orgs(status)
    `);
    
    await client.query('COMMIT');
    console.log('✅ Database schema initialized');
    
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Get all active scratch orgs
async function getActiveScratchOrgs() {
  const result = await pool.query(
    `SELECT * FROM scratch_orgs 
     WHERE status = 'Active' 
     ORDER BY created_date DESC`
  );
  return result.rows;
}

// Upsert scratch org
async function upsertScratchOrg(orgData) {
  const result = await pool.query(
    `INSERT INTO scratch_orgs 
     (org_id, org_name, username, alias, instance_url, access_token, refresh_token, 
      status, created_date, expiration_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (org_id) 
     DO UPDATE SET 
       org_name = EXCLUDED.org_name,
       username = EXCLUDED.username,
       alias = EXCLUDED.alias,
       instance_url = EXCLUDED.instance_url,
       access_token = EXCLUDED.access_token,
       refresh_token = EXCLUDED.refresh_token,
       status = EXCLUDED.status,
       expiration_date = EXCLUDED.expiration_date,
       updated_at = NOW()
     RETURNING id`,
    [
      orgData.orgId,
      orgData.orgName,
      orgData.username,
      orgData.alias,
      orgData.instanceUrl,
      orgData.accessToken,
      orgData.refreshToken,
      orgData.status,
      orgData.createdDate,
      orgData.expirationDate
    ]
  );
  return result.rows[0].id;
}

// Update org last polled time
async function updateOrgLastPolled(orgId) {
  await pool.query(
    'UPDATE scratch_orgs SET last_polled_at = NOW() WHERE id = $1',
    [orgId]
  );
}

// Insert source changes (batch)
async function insertSourceChanges(changes) {
  if (changes.length === 0) return;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const change of changes) {
      await client.query(
        `INSERT INTO source_changes 
         (scratch_org_id, change_id, member_type, member_name, revision_num, 
          changed_by, last_modified_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (scratch_org_id, change_id, member_name) 
         DO UPDATE SET 
           revision_num = EXCLUDED.revision_num,
           changed_by = EXCLUDED.changed_by,
           last_modified_date = EXCLUDED.last_modified_date`,
        [
          change.scratchOrgId,
          change.changeId,
          change.memberType,
          change.memberName,
          change.revisionNum,
          change.changedBy,
          change.lastModifiedDate
        ]
      );
    }
    
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Get recent changes across all orgs
async function getRecentChanges(limit = 100) {
  const result = await pool.query(
    `SELECT 
       sc.id,
       sc.change_id,
       sc.member_type,
       sc.member_name,
       sc.revision_num,
       sc.changed_by,
       sc.last_modified_date,
       so.org_id as scratch_org_id,
       so.org_name as scratch_org_name,
       so.alias as scratch_org_alias,
       so.username as scratch_org_username
     FROM source_changes sc
     JOIN scratch_orgs so ON sc.scratch_org_id = so.id
     WHERE so.status = 'Active'
     ORDER BY sc.last_modified_date DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

// Get changes for specific org
async function getChangesByOrg(orgId, limit = 50) {
  const result = await pool.query(
    `SELECT 
       sc.id,
       sc.change_id,
       sc.member_type,
       sc.member_name,
       sc.revision_num,
       sc.changed_by,
       sc.last_modified_date
     FROM source_changes sc
     JOIN scratch_orgs so ON sc.scratch_org_id = so.id
     WHERE so.org_id = $1
     ORDER BY sc.last_modified_date DESC
     LIMIT $2`,
    [orgId, limit]
  );
  return result.rows;
}

// Close pool
async function close() {
  await pool.end();
}

module.exports = {
  pool,
  testConnection,
  initializeSchema,
  getActiveScratchOrgs,
  upsertScratchOrg,
  updateOrgLastPolled,
  insertSourceChanges,
  getRecentChanges,
  getChangesByOrg,
  close
};
