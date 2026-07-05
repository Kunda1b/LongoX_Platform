# Full Platform Recovery Runbook

## Overview

Complete platform recovery from catastrophic failure including full region loss, data center destruction, or multi-region outage.

## Assumptions

- Infrastructure-as-code (Terraform) is available and up-to-date
- Backups are stored in a separate region/location
- DNS is managed externally (Route53) with separate credentials
- Container images are in a separate registry (ECR/GCR)
- Source code and configuration are in version control

## Recovery Tiers

| Tier   | Services                | RTO     | Priority    |
| ------ | ----------------------- | ------- | ----------- |
| Tier 0 | Auth, Routing, Database | 30 min  | Critical    |
| Tier 1 | Workflows, Executions   | 60 min  | High        |
| Tier 2 | Billing, Notifications  | 120 min | Medium      |
| Tier 3 | Analytics, Reporting    | 4 hours | Low         |
| Tier 4 | Marketplace, Search     | 8 hours | Best effort |

## Infrastructure Provisioning Order

### Phase 1: Networking (15 minutes)

```bash
# Provision VPC and subnets
cd infrastructure/terraform/environments/dr
terraform init
terraform workspace select dr || terraform workspace new dr

# Apply networking first (no dependencies)
terraform apply -target=module.vpc -auto-approve

# Verify network topology
aws ec2 describe-vpcs --vpc-ids $(terraform output -raw vpc_id)
```

### Phase 2: Kubernetes Cluster (20 minutes)

```bash
# Provision EKS cluster
terraform apply -target=module.eks -auto-approve

# Configure kubectl
aws eks update-kubeconfig --name longox-dr --region eu-west-1

# Verify cluster
kubectl cluster-info
kubectl get nodes
```

### Phase 3: Database (20 minutes)

```bash
# Provision RDS instance from latest snapshot
terraform apply -target=module.rds -auto-approve

# Verify database
DB_ENDPOINT=$(terraform output -raw rds_endpoint)
PGPASSWORD=$DB_PASSWORD psql -h $DB_ENDPOINT -U postgres -d longox -c "SELECT 1"
```

### Phase 4: Core Services (15 minutes)

```bash
# Deploy Helm chart with minimal services first
helm upgrade --install longox-platform infrastructure/helm/longox \
  --values infrastructure/helm/longox/values-dr.yaml \
  --set global.deploymentTier=tier0 \
  --namespace longox \
  --create-namespace \
  --wait

# Verify core services
kubectl wait --for=condition=available deployment/api-gateway -n longox --timeout=300s
kubectl wait --for=condition=available deployment/auth-service -n longox --timeout=300s
```

## Data Restore Order

### Critical Data (Phase 3 parallel)

```bash
# 1. Restore users and tenants (required for auth)
RESTORE_ID_1=$(curl -s -X POST https://api.longox.ai/api/v1/dr/backups/${BACKUP_ID}/restore \
  -d '{"tenantId": 1, "restoreType": "partial", "tables": ["users", "tenants"]}' | jq -r '.id')

# 2. Restore RBAC and permissions
RESTORE_ID_2=$(curl -s -X POST https://api.longox.ai/api/v1/dr/backups/${BACKUP_ID}/restore \
  -d '{"tenantId": 1, "restoreType": "partial", "tables": ["roles", "rbac_permissions", "memberships"]}' | jq -r '.id')

# 3. Restore workflow definitions
RESTORE_ID_3=$(curl -s -X POST https://api.longox.ai/api/v1/dr/backups/${BACKUP_ID}/restore \
  -d '{"tenantId": 1, "restoreType": "partial", "tables": ["workflows", "workflow_versions"]}' | jq -r '.id')
```

### Transactional Data (Tier 1)

```bash
# 4. Restore executions and checkpoints
RESTORE_ID_4=$(curl -s -X POST https://api.longox.ai/api/v1/dr/backups/${BACKUP_ID}/restore \
  -d '{"tenantId": 1, "restoreType": "partial", "tables": ["executions", "execution_checkpoints"]}' | jq -r '.id')

# 5. Restore audit log (compliance)
RESTORE_ID_5=$(curl -s -X POST https://api.longox.ai/api/v1/dr/backups/${BACKUP_ID}/restore \
  -d '{"tenantId": 1, "restoreType": "partial", "tables": ["audit_log"]}' | jq -r '.id')
```

### Supporting Data (Tier 2+)

```bash
# 6. Restore remaining services in dependency order
for table in billing billing_plans notifications templates connectors; do
  curl -s -X POST https://api.longox.ai/api/v1/dr/backups/${BACKUP_ID}/restore \
    -d "{\"tenantId\": 1, \"restoreType\": \"partial\", \"tables\": [\"${table}\"]}"
done
```

## Verification Gates

### Gate 1: Network Provisioned

```bash
# Check
curl -s -o /dev/null -w "%{http_code}" https://api.longox.ai/healthz
# Expected: 200
```

### Gate 2: Database Online

```bash
# Check
kubectl exec -n longox deploy/api-gateway -- curl -s localhost:3000/healthz | jq .db
# Expected: {"status": "connected"}
```

### Gate 3: Auth Service Working

```bash
# Check
curl -s -X POST https://api.longox.ai/auth/login \
  -d '{"email": "...", "password": "..."}' | jq .token
# Expected: JWT token returned
```

### Gate 4: Core API Functional

```bash
# Check
curl -s https://api.longox.ai/api/v1/workflows \
  -H "Authorization: Bearer ${TOKEN}" | jq '. | length'
# Expected: Non-empty array
```

### Gate 5: Execution Runtime Ready

```bash
# Check
curl -s https://api.longox.ai/api/v1/executions \
  -H "Authorization: Bearer ${TOKEN}" | jq '. | length'
# Expected: Non-empty array
```

### Gate 6: Full Suite Passes

```bash
# Check
./scripts/synthetic-test.sh --full-suite
# Expected: All tests passing
```

## Communication Plan

### Internal Communications

| Time  | Audience        | Channel          | Message               |
| ----- | --------------- | ---------------- | --------------------- |
| T+0   | SRE Team        | PagerDuty        | Incident declared     |
| T+5   | Engineering     | Slack #incidents | Recovery initiated    |
| T+15  | Leadership      | Email/Slack      | ETA updated           |
| T+60  | All-hands       | Status page      | Recovery progress     |
| T+180 | Customer-facing | Status page      | ETR for full recovery |

### External Communications

```text
SUBJECT: LongoX Platform Availability Incident
Status: INVESTIGATING / MITIGATING / RESOLVED
Impact: Platform unavailable in <REGION>
Started: <TIMESTAMP>
Recovery ETA: <TIMESTAMP>
Services Affected: All
Root Cause: <TBD>
```

## Estimated RTO: 2-4 hours

## Post-Recovery Checklist

- [ ] All Tier 0 services confirmed operational (< 30 min)
- [ ] All Tier 1 services confirmed operational (< 60 min)
- [ ] All Tier 2 services confirmed operational (< 2 hrs)
- [ ] All Tier 3 services confirmed operational (< 4 hrs)
- [ ] Data integrity verified across all restored tables
- [ ] Monitoring and alerting re-established
- [ ] Backup schedule resumed and verified
- [ ] Incident report filed with compliance evidence
- [ ] Root cause analysis initiated
- [ ] Runbook updated with lessons learned

## Related Resources

- region-failover.md — Regional failover procedures
- kubernetes-cluster-failure.md — K8s recovery procedures
- database-failover.md — Database failover procedures
- backup-restore-drill.md — Backup/restore rehearsal
- security-incident-response.md — Security incident procedures
