# Security Incident Response Runbook

## Incident Classification

| Severity | Description | Response Time | Examples |
|----------|-------------|--------------|----------|
| P0-Critical | Active data breach or unauthorized access | Immediate (< 5 min) | Credential leak, data exfiltration |
| P1-High | Confirmed vulnerability with active exploitation | < 15 min | RCE, privilege escalation |
| P2-Medium | Potential vulnerability or suspicious activity | < 60 min | Unusual API patterns, policy violations |
| P3-Low | Minor security findings | < 24 hours | Non-sensitive misconfiguration |

## Breach Containment Procedures

### Step 1: Immediate Isolation (P0/P1 only)
```bash
# 1. Revoke potentially compromised credentials
curl -X POST https://api.longox.ai/api/v1/credentials/revoke-all \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{"reason": "security_incident", "incidentId": "${INCIDENT_ID}"}'

# 2. Block suspicious IPs at the gateway
kubectl exec -n longox deploy/api-gateway -- \
  /usr/local/bin/block-ips.sh ${SUSPICIOUS_IPS}

# 3. Rate-limit affected users
aws wafv2 update-ip-set \
  --name longox-blocked-ips \
  --scope REGIONAL \
  --addresses ${SUSPICIOUS_IPS}

# 4. Rotate service tokens
kubectl delete secret -n longox longox-api-tokens
kubectl create secret generic longox-api-tokens \
  --from-literal=api-key=$(openssl rand -hex 32)
```

### Step 2: Evidence Collection
```bash
# 1. Capture current state
kubectl get pods --all-namespaces -o yaml > evidence/pods-$(date +%s).yaml
kubectl get events --all-namespaces -o yaml > evidence/events-$(date +%s).yaml

# 2. Collect audit logs for affected time window
curl -s "https://api.longox.ai/api/v1/audit?dateFrom=${INCIDENT_START}&dateTo=${NOW}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" > evidence/audit-logs.json

# 3. Capture database state
pg_dump -h $DB_HOST -U postgres -d longox \
  --data-only --table=audit_log --table=security_incidents \
  --table=credentials > evidence/db-snapshot-$(date +%s).sql

# 4. Capture network logs
kubectl logs -n longox -l app=api-gateway --tail=10000 > evidence/gateway-logs.txt
```

### Step 3: Deploy Hotfix
```bash
# 1. Apply emergency security patch
kubectl apply -f infrastructure/kubernetes/emergency/blocklist.yaml

# 2. Rebuild and deploy patched service
docker build -t longox/api-gateway:hotfix-${INCIDENT_ID} \
  --build-arg SECURITY_PATCH=true \
  -f services/api-gateway/Dockerfile .
docker push longox/api-gateway:hotfix-${INCIDENT_ID}

kubectl set image deployment/api-gateway -n longox \
  api-gateway=longox/api-gateway:hotfix-${INCIDENT_ID}

kubectl rollout status deployment/api-gateway -n longox --timeout=120s
```

## Forensic Analysis

### Audit Trail Review
```bash
# Check for unauthorized access patterns
curl -s "https://api.longox.ai/api/v1/audit?actions=user.login,failed_login,api.access" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq 'group_by(.user_id) | .[] | {user: .[0].user_id, count: length} | select(.count > 100)'
```

### Compliance Evidence Recording
```bash
# Record evidence with compliance service
curl -X POST https://api.longox.ai/api/v1/compliance/evidence \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{
    "incidentId": ${INCIDENT_ID},
    "evidenceType": "security_incident",
    "data": {
      "timeline": $(cat evidence/timeline.json),
      "affectedResources": $(cat evidence/resources.json),
      "actions": $(cat evidence/actions.json)
    },
    "hash": $(sha256sum evidence/audit-logs.json | cut -d' ' -f1)
  }'
```

### Log Analysis
```bash
# Check for data exfiltration patterns
cat evidence/gateway-logs.txt | \
  grep -E '(response_size|bytes_sent).{10,}' | \
  awk '{if($NF > 10000000) print}' | \
  sort -k2 -rn | head -20

# Check unauthorized API calls
cat evidence/audit-logs.json | jq -r \
  '.[] | select(.status_code >= 401) | .path' | \
  sort | uniq -c | sort -rn | head -10
```

## Communication Templates

### Initial Alert
```text
SECURITY INCIDENT: P${SEVERITY} - ${TITLE}
Time Detected: ${TIMESTAMP}
Impact: ${SCOPE}
Action: ${CONTAINMENT_ACTIONS}
Lead: ${INCIDENT_COMMANDER}
Next Update: ${NEXT_UPDATE}
```

### Status Update
```text
SECURITY UPDATE: ${INCIDENT_ID}
Status: ${CONTAINING | INVESTIGATING | RESOLVED}
Contained: ${YES/NO}
Evidence Collected: ${EVIDENCE_LIST}
Root Cause: ${PRELIMINARY_FINDING}
Remaining Actions: ${REMAINING_ACTIONS}
```

### Resolution Notice
```text
SECURITY RESOLUTION: ${INCIDENT_ID}
Resolved At: ${TIMESTAMP}
Duration: ${DURATION}
Root Cause: ${ROOT_CAUSE}
Remediation: ${REMEDIATION_STEPS}
Post-Mortem Scheduled: ${POST_MORTEM_DATE}
```

## Post-Incident Recovery

### Step 1: Restore Normal Operations
```bash
# 1. Remove emergency blocks
kubectl delete -f infrastructure/kubernetes/emergency/blocklist.yaml

# 2. Re-enable affected users
curl -X POST https://api.longox.ai/api/v1/users/batch-restore \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{"userIds": ${AFFECTED_USERS}}'

# 3. Verify normal traffic flow
curl -s https://api.longox.ai/healthz | jq .
```

### Step 2: Apply Permanent Fixes
```bash
# 1. Deploy security improvements
helm upgrade longox-platform infrastructure/helm/longox \
  --values infrastructure/helm/longox/values-security.yaml \
  --reuse-values

# 2. Update WAF rules
aws wafv2 update-web-acl --name longox-waf \
  --rules file://infrastructure/terraform/waf/rules-enhanced.json
```

### Step 3: Update Security Posture
- Rotate all service credentials
- Update incident response plan with findings
- Implement additional monitoring rules
- Schedule security audit

## Post-Mortem Checklist
- [ ] Root cause identified and documented
- [ ] Timeline of events reconstructed
- [ ] All evidence preserved with chain of custody
- [ ] Affected users/customers notified
- [ ] Regulatory reporting completed (if applicable)
- [ ] Permanent fix deployed and verified
- [ ] Monitoring improved to detect similar incidents
- [ ] Runbook updated with lessons learned
- [ ] Team debrief conducted within 48 hours

## Related Resources
- compliance-evidence.md — Evidence recording procedures
- gdpr-requests.md — GDPR breach notification procedures
- audit-exports.md — Audit log export procedures
- security-incidents.ts — Security incidents schema
