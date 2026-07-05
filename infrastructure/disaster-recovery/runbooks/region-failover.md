# Region Failover Runbook

This runbook describes the operational procedure for failing over the LongoX
platform from a primary region to a secondary region during a regional
outage or disaster recovery (DR) drill.

## Trigger criteria

Initiate a region failover when **any** of the following are observed:

- Primary region health checks fail for ≥ 5 consecutive minutes
- Primary region RDS / Aurora cluster is unreachable
- Primary region NAT gateway or VPC peering is down
- A planned DR drill is scheduled by the SRE team

## Pre-failover checks

1. Confirm the alert is not a false positive by reviewing the
   `synthetic-checks` Prometheus rules.
2. Verify the secondary region is healthy:
   ```bash
   kubectl --context=longox-secondary get nodes
   kubectl --context=longox-secondary get pods -A | grep -v Running
   ```
3. Confirm the most recent backup completed successfully:
   ```bash
   ./infrastructure/disaster-recovery/scripts/backup-verify.sh
   ```
4. Notify stakeholders in `#longox-incidents` that failover is starting.

## Failover procedure

1. **Promote the read replica** in the secondary region to primary:
   ```bash
   aws rds promote-read-replica \
     --db-instance-identifier longox-secondary-replica
   ```
2. **Update DNS** to point `app.longox.io` at the secondary region's
   load balancer:
   ```bash
   aws route53 change-resource-record-sets \
     --hosted-zone-id Z12345 \
     --change-batch file://dns-failover.json
   ```
3. **Scale up** the secondary region's compute plane:
   ```bash
   kubectl --context=longox-secondary scale \
     deployment/execution-service --replicas=20
   ```
4. **Repoint NATS** cluster to the secondary region's primary node.
5. **Verify** end-to-end traffic by hitting `https://app.longox.io/healthz`.

## Post-failover validation

- All synthetic checks pass for ≥ 10 consecutive minutes
- Error rate < 1% in the secondary region's Grafana dashboard
- No DLQ backlog growth in the secondary region
- Customer-facing status page updated to "Operational"

## Failback procedure

When the primary region is healthy again, follow the reverse procedure
during a planned maintenance window. Do **not** failback during business
hours without explicit VP of Engineering approval.

## Contact roster

- **SRE On-call:** PagerDuty schedule `longox-sre-primary`
- **DBRE:** PagerDuty schedule `longox-dbre`
- **Incident Commander:** On-call IC rotation
