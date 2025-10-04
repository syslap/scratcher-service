const express = require('express');
const router = express.Router();
const db = require('../lib/database');
const pollOrgs = require('../lib/poll-orgs');

// GET /api/changes - Get recent changes across all orgs
router.get('/changes', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const changes = await db.getRecentChanges(limit);
    
    res.json({
      success: true,
      count: changes.length,
      changes: changes.map(change => ({
        id: change.change_id,
        memberType: change.member_type,
        memberName: change.member_name,
        revisionNum: change.revision_num,
        changedBy: change.changed_by,
        lastModifiedDate: change.last_modified_date,
        scratchOrgId: change.scratch_org_id,
        scratchOrgName: change.scratch_org_name,
        scratchOrgAlias: change.scratch_org_alias,
        scratchOrgUsername: change.scratch_org_username
      }))
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/changes/:orgId - Get changes for specific org
router.get('/changes/:orgId', async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const changes = await db.getChangesByOrg(orgId, limit);
    
    res.json({
      success: true,
      orgId: orgId,
      count: changes.length,
      changes: changes.map(change => ({
        id: change.change_id,
        memberType: change.member_type,
        memberName: change.member_name,
        revisionNum: change.revision_num,
        changedBy: change.changed_by,
        lastModifiedDate: change.last_modified_date
      }))
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/orgs - Get all tracked scratch orgs
router.get('/orgs', async (req, res, next) => {
  try {
    const orgs = await db.getActiveScratchOrgs();
    
    res.json({
      success: true,
      count: orgs.length,
      orgs: orgs.map(org => ({
        id: org.org_id,
        name: org.org_name,
        username: org.username,
        alias: org.alias,
        status: org.status,
        createdDate: org.created_date,
        expirationDate: org.expiration_date,
        lastPolledAt: org.last_polled_at
      }))
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/poll - Trigger manual poll
router.post('/poll', async (req, res, next) => {
  try {
    // Start polling in background
    pollOrgs.pollAllOrgs().catch(err => {
      console.error('Manual poll failed:', err);
    });
    
    res.json({
      success: true,
      message: 'Polling started'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
