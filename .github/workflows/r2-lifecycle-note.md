# R2 Lifecycle Rules Configuration

This document describes the recommended R2 bucket lifecycle rules for backup retention and disaster recovery.

## Backup Bucket Lifecycle Rules

Configure these rules in your Cloudflare R2 dashboard for the `r2-romart-backups` bucket:

### 1. Database Backup Retention
- **Rule Name**: `db-backup-retention`
- **Prefix**: `db/`
- **Action**: Delete objects
- **Days after creation**: 30 days
- **Description**: Automatically delete database backups older than 30 days

### 2. Meilisearch Backup Retention
- **Rule Name**: `meili-backup-retention`
- **Prefix**: `meili/`
- **Action**: Delete objects
- **Days after creation**: 7 days
- **Description**: Keep Meilisearch dumps for 7 days (re-indexing is preferred)

### 3. Object Versioning
- **Enable Object Versioning**: Yes
- **Description**: Keep previous versions of backup files for additional protection

### 4. Cross-Region Replication (Optional)
- **Source Bucket**: `r2-romart-backups`
- **Destination Bucket**: `r2-romart-backups-dr` (in different region)
- **Replication Rule**: All objects with prefix `db/`
- **Description**: Weekly replication to secondary region for disaster recovery

## Manual Configuration Steps

1. Go to Cloudflare R2 Dashboard
2. Select your backup bucket
3. Go to "Settings" → "Lifecycle"
4. Add the rules above
5. Enable Object Versioning in "Settings" → "Object Versioning"
6. Configure Cross-Region Replication if needed

## Monitoring

- Monitor backup sizes and retention compliance
- Set up alerts for failed backups
- Regular restore testing (quarterly)
