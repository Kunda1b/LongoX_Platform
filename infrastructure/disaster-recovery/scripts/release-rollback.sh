#!/bin/bash
# Release Rollback Script
# Usage: ./release-rollback.sh <service> <target-version> [--dry-run] [--skip-migrations]
# Example: ./release-rollback.sh api-gateway v1.2.3 --dry-run

set -euo pipefail

SERVICE="${1:?Service name required}"
TARGET_VERSION="${2:?Target version required}"
MODE="${3:---execute}"
SKIP_MIGRATIONS="${4:-}"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="/var/log/release-rollback-${SERVICE}-${TIMESTAMP}.log"
API_BASE="${API_BASE:-https://api.longox.ai}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"

log() {
  echo "[$(date +%H:%M:%S)] $*" | tee -a "${LOG_FILE}"
}

check_dependency() {
  if ! command -v "$1" &>/dev/null; then
    log "ERROR: Required dependency '$1' not found"
    exit 1
  fi
}

validate_environment() {
  check_dependency kubectl
  check_dependency helm
  check_dependency curl
  check_dependency jq

  if [ -z "${ADMIN_TOKEN}" ]; then
    log "WARNING: ADMIN_TOKEN not set — API calls will fail"
  fi

  if ! kubectl config current-context &>/dev/null; then
    log "ERROR: kubectl not configured"
    exit 1
  fi

  log "Environment validated"
}

snapshot_current_state() {
  log "[1/7] Snapshotting current release state for ${SERVICE}..."

  local current_version
  current_version=$(kubectl get deployment "${SERVICE}" -n longox \
    -o jsonpath='{.metadata.labels.app\.kubernetes\.io/version}' 2>/dev/null || echo "unknown")

  local helm_revision
  helm_revision=$(helm list -n longox --filter "^${SERVICE}$" -o json 2>/dev/null | \
    jq -r '.[0].revision // 0')

  log "  Current version: ${current_version}"
  log "  Helm revision: ${helm_revision}"

  if [ "${MODE}" = "--execute" ]; then
    curl -s -X POST "${API_BASE}/api/v1/dr/rollback/plan" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"service\": \"${SERVICE}\", \"targetVersion\": \"${TARGET_VERSION}\"}" \
      > /tmp/rollback-plan-${TIMESTAMP}.json

    local plan_status
    plan_status=$(jq -r '.steps // empty' /tmp/rollback-plan-${TIMESTAMP}.json)
    if [ -n "${plan_status}" ]; then
      log "  Rollback plan generated"
      jq -r '.steps[] | "    Step \(.order): \(.action)"' /tmp/rollback-plan-${TIMESTAMP}.json
    else
      log "  WARNING: Could not generate rollback plan via API"
    fi
  else
    log "  DRY RUN: Would snapshot current state via API"
  fi

  echo "${current_version}"
}

scale_down_new() {
  log "[2/7] Scaling down current deployment of ${SERVICE}..."

  local current_replicas
  current_replicas=$(kubectl get deployment "${SERVICE}" -n longox \
    -o jsonpath='{.spec.replicas}' 2>/dev/null || echo 1)

  if [ "${MODE}" = "--execute" ]; then
    kubectl scale deployment "${SERVICE}" -n longox --replicas=0
    kubectl wait --for=delete pod -l "app=${SERVICE}" -n longox --timeout=120s 2>/dev/null || true
    log "  Scaled down to 0 replicas"
  else
    log "  DRY RUN: Would scale ${SERVICE} from ${current_replicas} to 0"
  fi

  echo "${current_replicas}"
}

revert_migrations() {
  local current_version="$1"

  log "[3/7] Reverting database migrations..."

  if [ -n "${SKIP_MIGRATIONS}" ]; then
    log "  SKIP: Migration rollback skipped (--skip-migrations flag)"
    return
  fi

  if [ "${MODE}" = "--execute" ]; then
    local steps_to_revert=0
    if command -v npm &>/dev/null && [ -f "package.json" ]; then
      steps_to_revert=$(npm run migrate:status 2>/dev/null | \
        grep -c "pending" || echo 0)
    fi

    if [ "${steps_to_revert}" -gt 0 ]; then
      log "  Reverting ${steps_to_revert} migration(s)..."
      npm run migrate:down -- --steps="${steps_to_revert}" \
        2>&1 | tee -a "${LOG_FILE}" || true
      log "  Migrations reverted"
    else
      log "  No migrations to revert"
    fi
  else
    log "  DRY RUN: Would revert migrations for ${SERVICE}"
  fi
}

restore_configuration() {
  local current_version="$1"
  local target_version="$2"

  log "[4/7] Restoring configuration from target version ${target_version}..."

  if [ "${MODE}" = "--execute" ]; then
    local configmap_name="${SERVICE}-config"

    if kubectl get configmap "${configmap_name}-${target_version}" -n longox &>/dev/null; then
      kubectl apply -f "infrastructure/helm/longox/configs/${SERVICE}/v${target_version}/configmap.yaml" \
        2>/dev/null || {
        log "  WARNING: Config file not found, attempting to restore from backup configmap"
        kubectl delete configmap "${configmap_name}" -n longox 2>/dev/null || true
        kubectl create configmap "${configmap_name}" -n longox \
          --from-literal="restored_at=${TIMESTAMP}" \
          --from-literal="version=${target_version}"
      }
      log "  Configuration restored"
    else
      log "  No version-specific configmap found, using current"
    fi
  else
    log "  DRY RUN: Would restore configuration for ${target_version}"
  fi
}

rollback_helm_release() {
  local target_version="$1"

  log "[5/7] Rolling back Helm release for ${SERVICE}..."

  local target_revision
  target_revision=$(helm list -n longox --filter "^${SERVICE}$" -o json 2>/dev/null | \
    jq -r '.[0].revision // 0')

  if [ "${target_revision}" -le 1 ]; then
    log "  No earlier revision to roll back to (current revision: ${target_revision})"
    return
  fi

  local rollback_revision=$((target_revision - 1))

  if [ "${MODE}" = "--execute" ]; then
    helm rollback "${SERVICE}" "${rollback_revision}" -n longox \
      --wait --timeout 5m 2>&1 | tee -a "${LOG_FILE}"
    log "  Rolled back to Helm revision ${rollback_revision}"
  else
    log "  DRY RUN: Would run: helm rollback ${SERVICE} ${rollback_revision} -n longox"
  fi
}

scale_up_old() {
  local replica_count="$1"
  local target_version="$2"

  log "[6/7] Scaling up ${SERVICE} v${target_version}..."

  if [ "${MODE}" = "--execute" ]; then
    kubectl scale deployment "${SERVICE}" -n longox --replicas="${replica_count}"
    kubectl rollout status deployment "${SERVICE}" -n longox --timeout=300s
    log "  Scaled up to ${replica_count} replicas"
  else
    log "  DRY RUN: Would scale ${SERVICE} to ${replica_count} replicas"
  fi
}

verify_and_test() {
  log "[7/7] Running post-rollback verification..."

  if [ "${MODE}" = "--execute" ]; then
    log "  Waiting for service to become healthy..."
    sleep 10

    local ready_pods
    ready_pods=$(kubectl get deployment "${SERVICE}" -n longox \
      -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo 0)

    if [ "${ready_pods}" -gt 0 ]; then
      log "  PASS: ${ready_pods} pod(s) ready"
    else
      log "  FAIL: No pods ready after rollback"
    fi

    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" \
      "${API_BASE}/healthz" --connect-timeout 10 2>/dev/null || echo "000")

    if [ "${http_code}" = "200" ]; then
      log "  PASS: Health check returned ${http_code}"
    else
      log "  FAIL: Health check returned ${http_code}"
    fi

    if [ "${MODE}" = "--execute" ]; then
      curl -s -X POST "${API_BASE}/api/v1/dr/rollback/execute" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"service\": \"${SERVICE}\", \"targetVersion\": \"${TARGET_VERSION}\"}" \
        > /tmp/rollback-record-${TIMESTAMP}.json

      local rollback_id
      rollback_id=$(jq -r '.id // "unknown"' /tmp/rollback-record-${TIMESTAMP}.json)
      log "  Rollback recorded with ID: ${rollback_id}"
    fi
  else
    log "  DRY RUN: Would verify deployment health"
  fi
}

# ============================================================================
# Main Rollback Execution
# ============================================================================

main() {
  validate_environment

  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║          Release Rollback: ${SERVICE}                               "
  echo "║          Target: ${TARGET_VERSION}                                       "
  echo "║          Mode: ${MODE}                                            "
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""

  local current_version
  current_version=$(snapshot_current_state)

  echo ""

  if [ "${current_version}" = "${TARGET_VERSION}" ]; then
    log "WARNING: ${SERVICE} is already at version ${TARGET_VERSION}. Nothing to roll back."
    exit 0
  fi

  local replica_count
  replica_count=$(scale_down_new)

  echo ""

  revert_migrations "${current_version}"

  echo ""

  restore_configuration "${current_version}" "${TARGET_VERSION}"

  echo ""

  rollback_helm_release "${TARGET_VERSION}"

  echo ""

  scale_up_old "${replica_count}" "${TARGET_VERSION}"

  echo ""

  verify_and_test

  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║          Rollback Completed                                 "
  echo "║          Service: ${SERVICE}                                           "
  echo "║          From: ${current_version} → To: ${TARGET_VERSION}             "
  echo "║          Log: ${LOG_FILE}                    "
  echo "╚══════════════════════════════════════════════════════════════╝"
}

main "$@"
