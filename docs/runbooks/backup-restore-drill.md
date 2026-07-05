# Backup/Restore Drill Runbook

## Overview

Quarterly backup restore rehearsal procedure to validate backup integrity, restore processes, and recovery time objectives.

## Frequency

- **Full drill**: Every quarter (4 times per year)
- **Validation only**: Monthly (checksum verification + sample restore)
- **Ad-hoc**: After any infrastructure or schema change

## Pre-Requisites

### Environment Setup

- Isolated restore environment (namespace: `backup-drill`)
- Database credentials for restore target
- S3 access to backup bucket
- Monitoring dashboard for restore metrics
- At least 2 engineers: one executing, one verifying

### Tooling Verification

```bash
# Check required tools
which psql aws kubectl jq velero

# Verify backup bucket access
aws s3 ls s3://longox-backups/

# Check available disk space (minimum 50GB)
df -h /tmp
```

## Drill Procedure

### Phase 1: Backup Selection (5 minutes)

```bash
# List recent backups
curl -s https://api.longox.ai/api/v1/dr/backups?tenantId=1 | jq '.[0:5]'

# Select a backup for drill (prefer > 30 days old for testing retention)
BACKUP_ID=$(curl -s https://api.longox.ai/api/v1/dr/backups?tenantId=1 | \
  jq -r '.[0].id')
echo "Selected backup: $BACKUP_ID"
```

### Phase 2: Validate Backup Integrity (10 minutes)

```bash
# Trigger validation
curl -s -X POST https://api.longox.ai/api/v1/dr/backups/${BACKUP_ID}/validate | jq .

# Manual checksum verification
BACKUP_PATH=$(curl -s https://api.longox.ai/api/v1/dr/backups/${BACKUP_ID} | jq -r '.storagePath')
EXPECTED_CHECKSUM=$(curl -s https://api.longox.ai/api/v1/dr/backups/${BACKUP_ID} | jq -r '.checksum')
COMPUTED_CHECKSUM=$(sha256sum ${BACKUP_PATH}* | sha256sum | cut -d' ' -f1)

if [ "${EXPECTED_CHECKSUM}" = "${COMPUTED_CHECKSUM}" ]; then
  echo "CHECKSUM MATCH: Backup integrity verified"
else
  echo "CHECKSUM MISMATCH: Backup may be corrupted"
fi
```

### Phase 3: Spin Up Isolated Restore Environment (15 minutes)

```bash
# Create isolated namespace
kubectl create namespace backup-drill

# Deploy temporary database
kubectl run -n backup-drill temp-db --image=postgres:16 \
  --env="POSTGRES_PASSWORD=drill-password" \
  --env="POSTGRES_DB=longox_drill" \
  --port=5432

kubectl wait --for=condition=ready pod/temp-db -n backup-drill --timeout=120s

# Port forward for restore
kubectl port-forward -n backup-drill pod/temp-db 54320:5432 &
sleep 2
```

### Phase 4: Execute Restore (20 minutes)

```bash
# Dry run first
curl -s -X POST https://api.longox.ai/api/v1/dr/backups/${BACKUP_ID}/restore \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": 1,
    "restoreType": "dry_run",
    "targetEnvironment": "drill",
    "notes": "Quarterly backup restore drill"
  }' | jq .

# Full restore to isolated environment
curl -s -X POST https://api.longox.ai/api/v1/dr/backups/${BACKUP_ID}/restore \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": 1,
    "restoreType": "full",
    "targetEnvironment": "drill",
    "restoredBy": "oncall-engineer",
    "notes": "Quarterly backup restore drill"
  }' | jq .
```

### Phase 5: Data Integrity Verification (15 minutes)

#### Row Count Validation

```bash
# Compare row counts between backup metadata and restored data
BACKUP_ROWS=$(curl -s https://api.longox.ai/api/v1/dr/backups/${BACKUP_ID} | jq '.rowCounts')

echo "Backup row counts: $BACKUP_ROWS"
echo ""
echo "Restored verification queries:"

PGPASSWORD=drill-password psql -h localhost -p 54320 -U postgres -d longox_drill <<SQL
SELECT 'workflows' as table_name, COUNT(*) as row_count FROM workflows
UNION ALL
SELECT 'executions', COUNT(*) FROM executions
UNION ALL
SELECT 'audit_log', COUNT(*) FROM audit_log
UNION ALL
SELECT 'billing', COUNT(*) FROM billing;
SQL
```

#### Sample Data Verification

```bash
# Verify sample records
PGPASSWORD=drill-password psql -h localhost -p 54320 -U postgres -d longox_drill <<SQL
-- Check data consistency
SELECT 'Sample workflow' as check_name, id, name FROM workflows LIMIT 5;
SELECT 'Sample execution' as check_name, id, workflow_id, status FROM executions LIMIT 5;

-- Check referential integrity
SELECT 'Orphaned executions' as check_name, COUNT(*) as count
FROM executions e
LEFT JOIN workflows w ON e.workflow_id = w.id
WHERE w.id IS NULL;
SQL
```

#### Schema Validation

```bash
# Verify schema matches expected version
PGPASSWORD=drill-password psql -h localhost -p 54320 -U postgres -d longox_drill <<SQL
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
SQL
```

### Phase 6: Restore Timing Verification

```bash
# Record restore metrics
RESTORE_ID=$(curl -s https://api.longox.ai/api/v1/dr/restores?backupId=${BACKUP_ID} | jq -r '.[0].id')
RESTORE_RECORD=$(curl -s https://api.longox.ai/api/v1/dr/restores/${RESTORE_ID})

echo "Restore metrics:"
echo "  Started: $(echo $RESTORE_RECORD | jq -r '.startedAt')"
echo "  Completed: $(echo $RESTORE_RECORD | jq -r '.completedAt')"
echo "  Row count restored: $(echo $RESTORE_RECORD | jq -r '.rowCountRestored')"
echo "  Integrity passed: $(echo $RESTORE_RECORD | jq -r '.integrityPassed')"
```

### Phase 7: Cleanup (5 minutes)

```bash
# Delete temporary restore environment
kubectl delete namespace backup-drill

# Kill port-forward
pkill -f "port-forward.*54320"

# Record drill completion
echo "Drill completed at: $(date)" >> /var/log/backup-drills/$(date +%Y%m%d).log
```

## Success Criteria

- [ ] Backup integrity check passes (checksum match)
- [ ] All tables restored with correct row counts
- [ ] Sample data verification passes (no corruption)
- [ ] Referential integrity maintained (no orphaned records)
- [ ] Schema version matches expected version
- [ ] Restore completes within expected time window (< 30 minutes for 1M rows)
- [ ] Dry run restores without modifying production data
- [ ] Cleanup completes successfully

## Expected Timings

| Dataset Size | Backup Validation | Restore | Verification | Total   |
| ------------ | ----------------- | ------- | ------------ | ------- |
| < 100K rows  | 2 min             | 5 min   | 5 min        | 12 min  |
| 100K-1M rows | 5 min             | 15 min  | 10 min       | 30 min  |
| 1M-10M rows  | 10 min            | 30 min  | 20 min       | 60 min  |
| > 10M rows   | 20 min            | 60 min  | 30 min       | 110 min |

## Failure Handling

### If checksum verification fails:

1. Select an earlier backup from the same day
2. If that also fails, escalate to SRE team
3. Investigate backup storage corruption

### If restore fails:

1. Check database logs: `kubectl logs -n backup-drill pod/temp-db`
2. Verify backup files are not truncated: `ls -la ${BACKUP_PATH}*`
3. Try partial restore of individual scopes

### If data integrity check fails:

1. Do NOT proceed to mark the drill as successful
2. File a critical bug with backup team
3. Check for schema migration drift

## Related Resources

- backup-restore.service.ts — Service implementation
- backup-verify.sh — Automated verification script
- API Routes: /api/v1/dr/backups/_, /api/v1/dr/restores/_
