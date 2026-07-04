# Database Failover Runbook

## Prerequisites
- Access to AWS RDS console or CLI
- Access to PagerDuty
- Read-only replica available
- Validated IAM permissions for RDS promotion
- Network connectivity to target region

## Failure Detection
1. Check RDS dashboard for status
2. Verify with `SELECT pg_is_in_recovery()` on replica
3. Check application error logs for connection timeouts
4. Monitor CloudWatch alarms for DB connection failures
5. Verify replication lag: `SELECT pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) FROM pg_stat_replication;`

## Failover Steps

### Step 1: Verify Replica Health
```bash
aws rds describe-db-instances --db-instance-identifier longox-db-replica \
  --query 'DBInstances[0].{Status:DBInstanceStatus, Lag:ReplicaLagSource}'
```

### Step 2: Promote Read Replica
```bash
aws rds promote-read-replica \
  --db-instance-identifier longox-db-replica
```
Monitor promotion progress (typically 1-5 minutes):
```bash
aws rds wait db-instance-available --db-instance-identifier longox-db-replica
```

### Step 3: Update Connection String
- Update database URL in Vault/Secrets Manager:
```bash
aws secretsmanager put-secret-value \
  --secret-id longox/database/connection-string \
  --secret-string "postgresql://user:password@longox-db-replica.xxxxxx.rds.amazonaws.com:5432/longox"
```

### Step 4: Rolling Pod Restart
```bash
kubectl rollout restart deployment -n longox -l 'app in (api-gateway,execution-service,workflow-service)'
kubectl rollout status deployment -n longox -l 'app in (api-gateway,execution-service,workflow-service)' --timeout=300s
```

### Step 5: Verify Replication Lag Cutover
Ensure lag was under 5 seconds before cutover:
```sql
SELECT NOW() - pg_last_xact_replay_timestamp() AS replication_lag;
```

### Step 6: Update DNS
If using DNS endpoints, update TTL and record:
```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "db.longox.internal",
        "Type": "CNAME",
        "TTL": 60,
        "ResourceRecords": [{"Value": "longox-db-replica.xxxxxx.rds.amazonaws.com"}]
      }
    }]
  }'
```

### Step 7: Application Health Verification
```bash
curl -s https://api.longox.ai/healthz | jq .db
kubectl logs -n longox -l app=api-gateway --tail=50 | grep "connection"
```

## Rollback
1. If new primary has issues within 30 minutes, promote original primary from DR
2. Follow same steps in reverse
3. Ensure original primary is fully caught up before rollback

## Post-Mortem Checklist
- [ ] Root cause analysis completed
- [ ] RTO/RPO metrics recorded
- [ ] Backup schedule updated if needed
- [ ] Replication health verified
- [ ] Incident report filed in compliance evidence
- [ ] Runbook updated with lessons learned

## Estimated Time: 5-15 minutes
## RPO: < 1 minute (sync replication)
## RTO: < 15 minutes

## Related Resources
- AWS RDS Documentation: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html
- PagerDuty Integration: https://support.pagerduty.com/docs/aws-cloudwatch-integration-guide
- Vault Secrets Management: infrastructure/terraform/vault/README.md
