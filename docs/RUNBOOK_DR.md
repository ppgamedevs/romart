# Disaster Recovery Runbook - Artfromromania

**Version**: 1.0  
**Last Updated**: 2024-12-26  
**RPO**: ≤ 30 minutes  
**RTO**: ≤ 4 hours  

## Overview

This runbook provides step-by-step procedures for disaster recovery scenarios affecting the Artfromromania platform. The system consists of:

- **Database**: Supabase PostgreSQL
- **Storage**: Cloudflare R2
- **Search**: Meilisearch
- **API**: Fastify (Node.js)
- **Web**: Next.js 15
- **Payments**: Stripe
- **Email**: Resend

## Pre-Incident Preparation

### Required Access
- [ ] Supabase Dashboard access
- [ ] Cloudflare R2 Dashboard access
- [ ] GitHub repository access
- [ ] Stripe Dashboard access
- [ ] Domain DNS access
- [ ] Age encryption keys (offline storage)

### Required Tools
- [ ] PostgreSQL client (`psql`)
- [ ] AWS CLI (for R2)
- [ ] Age encryption tool
- [ ] `xz` compression tool
- [ ] `jq` JSON processor

### Backup Verification
- [ ] Verify latest backup exists in R2: `s3://r2-romart-backups/db/`
- [ ] Test restore procedure monthly
- [ ] Verify encryption keys are accessible

## Disaster Recovery Scenarios

### Scenario 1: Database Corruption/Loss

**Symptoms**: Database connection failures, data inconsistencies, application errors

**RTO**: 2-3 hours

#### Step 1: Assess Impact
```bash
# Check database connectivity
psql "$DATABASE_URL" -c "SELECT 1;"

# Check recent backup availability
aws s3 ls s3://r2-romart-backups/db/ --endpoint-url "$R2_ENDPOINT" | tail -5
```

#### Step 2: Stop Applications
```bash
# Stop API and web applications
# (Platform-specific commands)
```

#### Step 3: Restore Database
```bash
# Download latest backup
LATEST_BACKUP=$(aws s3 ls s3://r2-romart-backups/db/ --endpoint-url "$R2_ENDPOINT" | tail -1 | awk '{print $4}')

# Download to local
aws s3 cp "s3://r2-romart-backups/db/$LATEST_BACKUP" ./latest-backup --endpoint-url "$R2_ENDPOINT"

# Restore database
bash ops/backup/restore_db_from_dump.sh ./latest-backup "$DATABASE_URL"
```

#### Step 4: Verify Restore
```bash
# Run verification script
bash ops/backup/verify_restore.sh "$DATABASE_URL"
```

#### Step 5: Reindex Search
```bash
# Trigger Meilisearch reindexing
curl -X POST "http://localhost:3001/admin/reindex" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### Step 6: Restart Applications
```bash
# Start API and web applications
# Verify health checks
curl http://localhost:3001/healthz
```

### Scenario 2: R2 Storage Failure

**Symptoms**: File upload/download failures, missing images, storage errors

**RTO**: 1-2 hours

#### Step 1: Assess Impact
```bash
# Check R2 connectivity
aws s3 ls s3://r2-romart-media/ --endpoint-url "$R2_ENDPOINT"

# Check bucket status
aws s3api get-bucket-versioning --bucket r2-romart-media --endpoint-url "$R2_ENDPOINT"
```

#### Step 2: Check Object Versioning
```bash
# List object versions for critical files
aws s3api list-object-versions \
  --bucket r2-romart-media \
  --prefix "artworks/" \
  --endpoint-url "$R2_ENDPOINT"
```

#### Step 3: Restore from Versions
```bash
# Restore specific object versions if needed
aws s3api get-object \
  --bucket r2-romart-media \
  --key "artworks/example.jpg" \
  --version-id "VERSION_ID" \
  --endpoint-url "$R2_ENDPOINT" \
  restored-file.jpg
```

#### Step 4: Verify Storage
```bash
# Test file operations
curl -X POST "http://localhost:3001/uploads/test" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Scenario 3: Meilisearch Failure

**Symptoms**: Search not working, indexing errors, search timeouts

**RTO**: 30-60 minutes

#### Step 1: Check Meilisearch Health
```bash
curl -H "Authorization: Bearer $MEILI_MASTER_KEY" \
  "$MEILI_HOST/health"
```

#### Step 2: Restore from Backup (if available)
```bash
# Download latest Meili dump
LATEST_MEILI=$(aws s3 ls s3://r2-romart-backups/meili/ --endpoint-url "$R2_ENDPOINT" | tail -1 | awk '{print $4}')

# Restore dump
curl -X POST "$MEILI_HOST/dumps" \
  -H "Authorization: Bearer $MEILI_MASTER_KEY" \
  -F "dump=@$LATEST_MEILI"
```

#### Step 3: Reindex from Database
```bash
# Trigger full reindexing
curl -X POST "http://localhost:3001/admin/reindex" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Monitor progress
curl -H "Authorization: Bearer $MEILI_MASTER_KEY" \
  "$MEILI_HOST/indexes/artworks/stats"
```

### Scenario 4: Complete System Failure

**Symptoms**: All services down, infrastructure failure

**RTO**: 3-4 hours

#### Step 1: Infrastructure Assessment
- [ ] Check hosting provider status
- [ ] Verify network connectivity
- [ ] Assess data center status

#### Step 2: Database Recovery
```bash
# Follow Scenario 1 steps
```

#### Step 3: Storage Recovery
```bash
# Follow Scenario 2 steps
```

#### Step 4: Search Recovery
```bash
# Follow Scenario 3 steps
```

#### Step 5: Application Deployment
```bash
# Deploy applications to backup infrastructure if needed
git clone https://github.com/your-org/romart.git
cd romart
pnpm install
pnpm run build
pnpm run start
```

#### Step 6: DNS/Network Configuration
- [ ] Update DNS records if needed
- [ ] Configure load balancers
- [ ] Update CDN settings

## Post-Recovery Procedures

### 1. Data Integrity Verification
```bash
# Run comprehensive verification
bash ops/backup/verify_restore.sh "$DATABASE_URL"

# Check application functionality
curl http://localhost:3001/healthz
curl http://localhost:3000/api/health
```

### 2. Performance Monitoring
- [ ] Monitor application response times
- [ ] Check database query performance
- [ ] Verify search functionality
- [ ] Monitor file upload/download speeds

### 3. Backup Verification
```bash
# Verify backup system is working
bash ops/backup/backup_db.sh

# Check backup retention
aws s3 ls s3://r2-romart-backups/db/ --endpoint-url "$R2_ENDPOINT"
```

### 4. Communication
- [ ] Notify stakeholders of recovery completion
- [ ] Update status page
- [ ] Document incident timeline
- [ ] Schedule post-mortem meeting

## Fire Drills (Quarterly)

### Drill 1: Database Restore Test
**Objective**: Verify database restore procedure works
**Duration**: 2 hours
**Participants**: DevOps team

**Steps**:
1. Create test database
2. Restore from latest backup
3. Verify data integrity
4. Test application connectivity
5. Document results

### Drill 2: Storage Recovery Test
**Objective**: Verify R2 object versioning and recovery
**Duration**: 1 hour
**Participants**: DevOps team

**Steps**:
1. Simulate object corruption
2. Restore from version history
3. Verify file integrity
4. Test application file operations

### Drill 3: Full System Recovery Test
**Objective**: End-to-end disaster recovery simulation
**Duration**: 4 hours
**Participants**: Full engineering team

**Steps**:
1. Simulate complete system failure
2. Execute full recovery procedure
3. Verify all systems operational
4. Performance testing
5. Documentation review

## Emergency Contacts

### Primary Contacts
- **DevOps Lead**: [Name] - [Phone] - [Email]
- **Database Admin**: [Name] - [Phone] - [Email]
- **Infrastructure Lead**: [Name] - [Phone] - [Email]

### Escalation Contacts
- **CTO**: [Name] - [Phone] - [Email]
- **CEO**: [Name] - [Phone] - [Email]

### External Contacts
- **Supabase Support**: support@supabase.com
- **Cloudflare Support**: https://support.cloudflare.com
- **Stripe Support**: https://support.stripe.com

## Recovery Metrics

### RPO (Recovery Point Objective)
- **Database**: ≤ 30 minutes (PITR + daily backups)
- **Storage**: ≤ 1 hour (object versioning)
- **Search**: ≤ 15 minutes (reindexing)

### RTO (Recovery Time Objective)
- **Database**: ≤ 2 hours
- **Storage**: ≤ 1 hour
- **Search**: ≤ 30 minutes
- **Full System**: ≤ 4 hours

### Success Criteria
- [ ] All critical services operational
- [ ] Data integrity verified
- [ ] Performance within acceptable limits
- [ ] Security measures intact
- [ ] Monitoring systems active

## Lessons Learned

After each incident or drill, document:
- What worked well
- What could be improved
- Timeline of events
- Root cause analysis
- Action items for improvement

---

**Document Control**
- **Owner**: DevOps Team
- **Review Schedule**: Quarterly
- **Next Review**: [Date]
- **Approved By**: [Name] - [Date]
