#!/bin/bash
# Active-Passive Failover Drill Script
# Usage: ./failover-drill.sh <primary-region> <dr-region> [--execute] [--rollback]
# Example: ./failover-drill.sh us-east-1 eu-west-1 --dry-run

set -euo pipefail

PRIMARY_REGION="${1:?Primary region required}"
DR_REGION="${2:?DR region required}"
MODE="${3:---dry-run}"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="/var/log/failover-drill-${TIMESTAMP}.log"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"
API_BASE="${API_BASE:-https://api.longox.ai}"

log() {
  echo "[$(date +%H:%M:%S)] $*" | tee -a "${LOG_FILE}"
}

check_dependency() {
  if ! command -v "$1" &>/dev/null; then
    log "ERROR: Required dependency '$1' not found"
    exit 1
  fi
}

validate_env() {
  check_dependency curl
  check_dependency jq
  check_dependency aws
  check_dependency kubectl

  if [ -z "${ADMIN_TOKEN}" ]; then
    log "WARNING: ADMIN_TOKEN not set. API calls may fail."
  fi
}

run_health_check() {
  local region="$1"
  local base_url="${region}.longox.ai"

  log "  Health check for ${region}..."

  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://${base_url}/healthz" --connect-timeout 5 2>/dev/null || echo "000")

  if [ "${http_code}" = "200" ]; then
    log "  PASS: ${region} health check returned ${http_code}"
    return 0
  else
    log "  FAIL: ${region} health check returned ${http_code}"
    return 1
  fi
}

check_replica_lag() {
  local region="$1"
  log "  Checking DB replica lag in ${region}..."

  local lag
  lag=$(kubectl exec -n longox deploy/api-gateway -- \
    curl -s localhost:3000/healthz 2>/dev/null | jq -r '.db_replica_lag // "unknown"')

  log "  Replica lag: ${lag}s"
  echo "${lag}"
}

promote_dr_database() {
  local region="$1"
  log "  Promoting DR database in ${region}..."

  aws rds promote-read-replica \
    --db-instance-identifier "longox-dr-db" \
    --region "${region}" 2>&1 | tee -a "${LOG_FILE}"

  log "  Waiting for promotion to complete..."
  aws rds wait db-instance-available \
    --db-instance-identifier "longox-dr-db" \
    --region "${region}" 2>&1 | tee -a "${LOG_FILE}"

  log "  Database promotion completed"
}

update_dns_routing() {
  local target_region="$1"
  local hosted_zone_id="${ROUTE53_ZONE_ID:-}"

  if [ -z "${hosted_zone_id}" ]; then
    log "  SKIP: ROUTE53_ZONE_ID not set"
    return
  fi

  log "  Updating Route53 routing to ${target_region}..."

  cat > /tmp/dns-change-${TIMESTAMP}.json <<EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.longox.ai",
        "Type": "A",
        "SetIdentifier": "${target_region}",
        "Failover": "PRIMARY",
        "AliasTarget": {
          "HostedZoneId": "${target_region}-alb-zone",
          "DNSName": "${target_region}-alb.amazonaws.com",
          "EvaluateTargetHealth": true
        },
        "HealthCheckId": "hc-${target_region}"
      }
    }
  ]
}
EOF

  aws route53 change-resource-record-sets \
    --hosted-zone-id "${hosted_zone_id}" \
    --change-batch "file:///tmp/dns-change-${TIMESTAMP}.json" 2>&1 | tee -a "${LOG_FILE}"
}

activate_dr_pool() {
  local region="$1"

  log "  Activating DR pool in ${region}..."

  curl -s -X POST "${API_BASE}/api/v1/dr/pools/${region}/register" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"isPrimary": true}' | tee -a "${LOG_FILE}"
}

run_synthetic_tests() {
  local region="$1"

  log "  Running synthetic transaction tests in ${region}..."

  local endpoints=("/healthz" "/api/v1/workflows?limit=1" "/api/v1/executions?limit=1")

  for endpoint in "${endpoints[@]}"; do
    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" \
      "${API_BASE}${endpoint}" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      --connect-timeout 10 2>/dev/null || echo "000")

    if [ "${http_code}" = "200" ] || [ "${http_code}" = "401" ]; then
      log "  PASS: ${endpoint} returned ${http_code}"
    else
      log "  FAIL: ${endpoint} returned ${http_code}"
    fi
  done
}

rollback_dns() {
  log "  Rolling back DNS routing to ${PRIMARY_REGION}..."
  update_dns_routing "${PRIMARY_REGION}"
}

rollback_database() {
  log "  Rolling back database to ${PRIMARY_REGION}..."
  if [ -n "${ROLLBACK_DB_INSTANCE:-}" ]; then
    aws rds promote-read-replica \
      --db-instance-identifier "${ROLLBACK_DB_INSTANCE}" \
      --region "${PRIMARY_REGION}" 2>&1 | tee -a "${LOG_FILE}" || true
  fi
}

rollback_pool() {
  log "  Reverting pool to ${PRIMARY_REGION}..."

  curl -s -X POST "${API_BASE}/api/v1/dr/pools/${PRIMARY_REGION}/register" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"isPrimary": true}' | tee -a "${LOG_FILE}" || true
}

# ============================================================================
# Main Drill Execution
# ============================================================================

main() {
  validate_env

  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║          Failover Drill: ${PRIMARY_REGION} → ${DR_REGION}         "
  echo "║          Mode: ${MODE}                                      "
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""

  # Step 1: Pre-flight checks
  log "[1/6] Running pre-flight checks..."

  run_health_check "${PRIMARY_REGION}" || {
    log "WARNING: Primary region health check failed"
  }

  run_health_check "${DR_REGION}" || {
    log "ERROR: DR region health check failed — aborting drill"
    exit 1
  }

  local primary_lag
  primary_lag=$(check_replica_lag "${PRIMARY_REGION}")

  local dr_lag
  dr_lag=$(check_replica_lag "${DR_REGION}")

  log "  Primary replica lag: ${primary_lag}s"
  log "  DR replica lag: ${dr_lag}s"

  echo ""

  # Step 2: Promote DR database
  log "[2/6] Promoting DR database in ${DR_REGION}..."

  if [ "${MODE}" = "--execute" ]; then
    promote_dr_database "${DR_REGION}"
  else
    log "  DRY RUN: Would promote database in ${DR_REGION}"
  fi

  echo ""

  # Step 3: Update DNS routing
  log "[3/6] Updating DNS routing..."

  if [ "${MODE}" = "--execute" ]; then
    update_dns_routing "${DR_REGION}"
  else
    log "  DRY RUN: Would update Route53 routing to ${DR_REGION}"
  fi

  echo ""

  # Step 4: Activate DR pool
  log "[4/6] Activating DR execution pool..."

  if [ "${MODE}" = "--execute" ]; then
    activate_dr_pool "${DR_REGION}"
  else
    log "  DRY RUN: Would activate pool in ${DR_REGION}"
  fi

  echo ""

  # Step 5: Health verification
  log "[5/6] Running health verification in ${DR_REGION}..."

  if [ "${MODE}" = "--execute" ]; then
    sleep 10
    run_health_check "${DR_REGION}" || {
      log "FAIL: DR region health check failed after failover"
    }
  fi

  run_synthetic_tests "${DR_REGION}"

  echo ""

  # Step 6: Rollback (for drills)
  log "[6/6] Rollback phase..."

  if [ "${MODE}" = "--dry-run" ]; then
    log "  DRY RUN — Rolling back all changes..."

    rollback_dns
    rollback_database
    rollback_pool

    log "  Rollback completed"
  elif [ "${MODE}" = "--rollback" ]; then
    log "  Executing rollback..."

    rollback_dns
    rollback_database
    rollback_pool

    log "  Rollback completed"
  else
    log "  Execute mode — no automatic rollback. Manual rollback available with --rollback"
  fi

  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║          Drill Completed                                    "
  echo "║          Log: ${LOG_FILE}                    "
  echo "╚══════════════════════════════════════════════════════════════╝"
}

main "$@"
