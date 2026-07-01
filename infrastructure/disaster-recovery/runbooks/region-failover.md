# Region Failover Runbook

## Overview
Active-passive cross-region failover between primary and disaster recovery regions.

## Architecture
- **Primary Region**: us-east-1 (active)
- **DR Region**: eu-west-1 (passive, warm standby)
- **Replication**: Async cross-region DB replication, S3 CRR, event stream mirroring

## Failover Triggers
- Region health check failure across 3+ availability zones
- >5% error rate sustained for 5 minutes
- Latency p99 exceeds 5 seconds for 3 minutes
- Manual decision by on-call engineer or SRE lead

## Pre-Failover Verification

### 1. Confirm DR Region Readiness
```bash
# Check DR database replica lag
aws rds describe-db-instances --db-instance-identifier longox-dr-db \
  --query 'DBInstances[0].{Status:DBInstanceStatus, Lag:ReplicaLagSource}'

# Verify DR region EKS cluster health
aws eks describe-cluster --name longox-dr --region eu-west-1

# Check S3 replication status
aws s3api get-bucket-replication --bucket longox-data-eu-west-1
```

### 2. Verify DNS Health Checks
```bash
# Check Route53 health check status
aws route53 list-health-checks | jq '.HealthChecks[] | select(.HealthCheckConfig.FullyQualifiedDomainName | contains("longox"))'

# Verify current DNS routing
dig api.longox.ai +short
```

## Failover Steps

### Step 1: Initiate Failover
```bash
# Notify stakeholders
pagerduty trigger --service "LongoX Platform" --severity critical \
  --description "Initiating cross-region failover from us-east-1 to eu-west-1"
```

### Step 2: Traffic Drain from Primary Region
```bash
# Mark primary region pool as draining
curl -X POST https://api.longox.ai/api/v1/dr/pools/us-east-1/drain \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"

# Wait for in-flight executions to complete (or timeout after 5 minutes)
kubectl cordon -n longox nodes -l topology.kubernetes.io/region=us-east-1
```

### Step 3: Promote DR Database
```bash
aws rds promote-read-replica \
  --db-instance-identifier longox-dr-db \
  --region eu-west-1

# Wait for promotion
aws rds wait db-instance-available \
  --db-instance-identifier longox-dr-db \
  --region eu-west-1
```

### Step 4: Update Secrets for DR Region
```bash
aws secretsmanager update-secret \
  --secret-id longox/database/connection-string-dr \
  --secret-string "postgresql://user:password@longox-dr-db.xxxxxx.eu-west-1.rds.amazonaws.com:5432/longox"
```

### Step 5: Switch DNS Routing (Route53)
```bash
# Update Route53 failover routing policy
aws route53 change-resource-record-sets \
  --hosted-zone-id ZONE_ID \
  --change-batch file://dns-failover.json
```

**dns-failover.json:**
```json
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.longox.ai",
        "Type": "A",
        "SetIdentifier": "dr",
        "Failover": "PRIMARY",
        "AliasTarget": {
          "HostedZoneId": "DR_ALB_ZONE_ID",
          "DNSName": "dr-alb-xxxxxx.eu-west-1.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    }
  ]
}
```

### Step 6: Activate DR Regional Pool
```bash
curl -X POST https://api.longox.ai/api/v1/dr/pools/eu-west-1/activate \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{"isPrimary": true}'
```

### Step 7: Cache Warmup
```bash
# Trigger cache warmup job in DR region
kubectl create job -n longox cache-warmup --image=longox/cache-warmer:latest
kubectl wait --for=condition=complete job/cache-warmup -n longox --timeout=600s
```

### Step 8: Health Verification
```bash
# Run comprehensive health checks
for endpoint in /healthz /api/v1/workflows /api/v1/executions; do
  curl -s -o /dev/null -w "%{http_code}" https://api.longox.ai${endpoint}
  echo " ${endpoint}"
done

# Verify database connectivity
kubectl exec -n longox deploy/api-gateway -- curl -s localhost:3000/healthz

# Run synthetic transaction test
./scripts/synthetic-test.sh --region eu-west-1
```

### Step 9: Confirm Failover Status
```bash
curl -s https://api.longox.ai/api/v1/dr/failover/status | jq .
```

## Traffic Drain from Failed Region
1. Set primary region pool to `draining` status
2. Allow 5 minutes for in-flight requests to complete
3. Scale down primary region compute:
   ```bash
   kubectl scale deployment -n longox --all --replicas=0
   ```
4. Verify all traffic is served from DR region

## Rollback (Failback)
1. Ensure original primary region is fully recovered
2. Re-establish database replication from DR to primary
3. Follow the same failover steps in reverse
4. Schedule during maintenance window if possible

## Post-Mortem Checklist
- [ ] Failover time recorded (target: < 15 minutes)
- [ ] Data loss assessed (target: < 1 minute RPO)
- [ ] Root cause identified
- [ ] DR plan updated with findings
- [ ] Failed region remediation scheduled
- [ ] Team debrief conducted

## Estimated RTO: 15-30 minutes
## RPO: < 1 minute

## Communication Template
```
SUBJECT: [INCIDENT] Cross-Region Failover <STATUS>
Region: us-east-1 → eu-west-1
Started: <TIMESTAMP>
Status: <IN_PROGRESS | COMPLETED | ROLLED_BACK>
Impact: <DESCRIPTION>
Next Update: <TIMESTAMP>
```
