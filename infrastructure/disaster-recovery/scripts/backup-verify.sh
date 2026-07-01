#!/bin/bash
# Backup Verification Script
# Usage: ./backup-verify.sh <backup-id> [--verbose]
# Example: ./backup-verify.sh 42 --verbose

set -euo pipefail

BACKUP_ID="${1:?Backup ID required}"
VERBOSE="${2:-}"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
WORK_DIR="/tmp/backup-verify-${TIMESTAMP}"
LOG_FILE="/var/log/backup-verify-${TIMESTAMP}.log"
API_BASE="${API_BASE:-https://api.longox.ai}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"

log() {
  echo "[$(date +%H:%M:%S)] $*" | tee -a "${LOG_FILE}"
}

verbose() {
  if [ -n "${VERBOSE}" ]; then
    echo "  $*"
  fi
}

check_dependency() {
  if ! command -v "$1" &>/dev/null; then
    log "ERROR: Required dependency '$1' not found"
    exit 1
  fi
}

verify_backup_exists() {
  local backup_id="$1"

  log "Fetching backup ${backup_id} metadata..."

  BACKUP_JSON=$(curl -s "${API_BASE}/api/v1/dr/backups/${backup_id}" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}")

  BACKUP_STATUS=$(echo "${BACKUP_JSON}" | jq -r '.status')
  BACKUP_SCOPE=$(echo "${BACKUP_JSON}" | jq -r '.scope')
  BACKUP_CHECKSUM=$(echo "${BACKUP_JSON}" | jq -r '.checksum')
  BACKUP_STORAGE_PATH=$(echo "${BACKUP_JSON}" | jq -r '.storagePath')
  BACKUP_FILE_SIZE=$(echo "${BACKUP_JSON}" | jq -r '.fileSizeBytes')
  BACKUP_ROW_COUNTS=$(echo "${BACKUP_JSON}" | jq -r '.rowCounts')

  if [ "${BACKUP_STATUS}" = "null" ] || [ -z "${BACKUP_STATUS}" ]; then
    log "ERROR: Backup ${backup_id} not found"
    exit 1
  fi

  log "Backup ID: ${backup_id}"
  log "Status: ${BACKUP_STATUS}"
  log "Scope: ${BACKUP_SCOPE}"
  log "Checksum: ${BACKUP_CHECKSUM}"
  log "File Size: ${BACKUP_FILE_SIZE} bytes"
  log "Row Counts: ${BACKUP_ROW_COUNTS}"

  if [ "${BACKUP_STATUS}" != "completed" ]; then
    log "WARNING: Backup is not in 'completed' status (current: ${BACKUP_STATUS})"
    log "Proceeding with verification anyway..."
  fi
}

download_backup() {
  local backup_id="$1"
  local work_dir="$2"

  log "Creating working directory: ${work_dir}"
  mkdir -p "${work_dir}"

  log "Downloading backup files..."

  BACKUP_STORAGE_PATH=$(echo "${BACKUP_JSON}" | jq -r '.storagePath')

  if [ -d "${BACKUP_STORAGE_PATH}" ]; then
    cp -r "${BACKUP_STORAGE_PATH}" "${work_dir}/backup-files/"
    log "Copied backup from local path: ${BACKUP_STORAGE_PATH}"
  elif [[ "${BACKUP_STORAGE_PATH}" == s3://* ]]; then
    aws s3 cp "${BACKUP_STORAGE_PATH}" "${work_dir}/backup-files/" --recursive
    log "Downloaded from S3: ${BACKUP_STORAGE_PATH}"
  elif [ -n "${S3_BACKUP_BUCKET:-}" ]; then
    local s3_path="s3://${S3_BACKUP_BUCKET}/backups/${backup_id}/"
    aws s3 cp "${s3_path}" "${work_dir}/backup-files/" --recursive || true
    log "Attempted download from S3: ${s3_path}"
  else
    log "WARNING: Backup storage path not accessible. Using API-based verification only."
    mkdir -p "${work_dir}/backup-files"
  fi
}

verify_checksum() {
  local work_dir="$1"
  local expected_checksum="$2"

  log "Verifying backup checksum..."

  if [ "${expected_checksum}" = "null" ] || [ -z "${expected_checksum}" ]; then
    log "SKIP: No checksum recorded for this backup"
    return 0
  fi

  local computed_checksum
  computed_checksum=$(find "${work_dir}/backup-files" -type f -exec sha256sum {} \; | \
    sort | sha256sum | cut -d' ' -f1)

  verbose "Expected checksum: ${expected_checksum}"
  verbose "Computed checksum: ${computed_checksum}"

  if [ "${computed_checksum}" = "${expected_checksum}" ]; then
    log "PASS: Checksum verification successful"
    return 0
  else
    log "FAIL: Checksum mismatch — backup may be corrupted"
    return 1
  fi
}

verify_file_integrity() {
  local work_dir="$1"

  log "Verifying file integrity..."

  local file_count=0
  local total_size=0

  while IFS= read -r -d '' file; do
    local size
    size=$(stat -c%s "${file}" 2>/dev/null || stat -f%z "${file}" 2>/dev/null || echo 0)

    if [ "${size}" -eq 0 ]; then
      log "WARNING: Empty file found: ${file}"
    fi

    if ! jq empty "${file}" 2>/dev/null; then
      log "FAIL: Invalid JSON in file: ${file}"
      return 1
    fi

    file_count=$((file_count + 1))
    total_size=$((total_size + size))
    verbose "  ${file}: ${size} bytes"
  done < <(find "${work_dir}/backup-files" -name "*.json" -print0 2>/dev/null)

  log "Files: ${file_count}, Total size: ${total_size} bytes"
  log "PASS: All files are valid JSON"
}

verify_data_sampling() {
  local work_dir="$1"

  log "Performing data sampling verification..."

  local files
  files=$(find "${work_dir}/backup-files" -name "*.json" 2>/dev/null || true)

  if [ -z "${files}" ]; then
    log "SKIP: No backup files to sample"
    return 0
  fi

  for file in ${files}; do
    local filename
    filename=$(basename "${file}")

    local row_count
    row_count=$(jq 'length' "${file}" 2>/dev/null || echo 0)

    if [ "${row_count}" -eq 0 ]; then
      log "WARNING: ${filename} is empty"
      continue
    fi

    log "  ${filename}: ${row_count} rows"

    if [ "${row_count}" -gt 0 ]; then
      local sample
      sample=$(jq '.[0] | keys' "${file}" 2>/dev/null || echo "[]")
      local fields
      fields=$(echo "${sample}" | jq 'length')
      verbose "  ${filename} fields per row: ${fields}"
    fi
  done

  log "PASS: Data sampling completed"
}

verify_backup_scope() {
  local scope="$1"
  local work_dir="$2"

  log "Verifying backup scope completeness..."

  local scope_files
  case "${scope}" in
    full)
      scope_files="workflows executions audit billing"
      ;;
    workflows)
      scope_files="workflows"
      ;;
    executions)
      scope_files="executions"
      ;;
    audit)
      scope_files="audit"
      ;;
    billing)
      scope_files="billing"
      ;;
    *)
      log "WARNING: Unknown scope '${scope}'"
      return 0
      ;;
  esac

  for scope_file in ${scope_files}; do
    local expected_file="${work_dir}/backup-files/backup_${scope}_*_${scope_file}.json"
    local found
    found=$(find "${work_dir}/backup-files" -name "*${scope_file}*" 2>/dev/null || true)

    if [ -z "${found}" ]; then
      log "FAIL: Missing backup file for scope: ${scope_file}"
      return 1
    else
      verbose "  Found: ${found}"
    fi
  done

  log "PASS: All required scope files present"
}

run_restore_dry_run() {
  local backup_id="$1"

  log "Running restore dry run..."

  local restore_result
  restore_result=$(curl -s -X POST "${API_BASE}/api/v1/dr/backups/${backup_id}/restore" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
      "tenantId": 1,
      "restoreType": "dry_run",
      "targetEnvironment": "verification",
      "notes": "Automated backup verification drill"
    }')

  local status
  status=$(echo "${restore_result}" | jq -r '.status')

  if [ "${status}" = "completed" ]; then
    log "PASS: Restore dry run completed successfully"
    verbose "Restore result: $(echo "${restore_result}" | jq -c '{id, status, tablesRestored, rowCountRestored}')"
  else
    log "FAIL: Restore dry run failed with status: ${status}"
    log "Error: $(echo "${restore_result}" | jq -r '.errorMessage // "unknown"')"
    return 1
  fi
}

report_results() {
  local checksum_pass="$1"
  local integrity_pass="$2"
  local scope_pass="$3"
  local restore_pass="$4"

  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║          Backup Verification Report                          "
  echo "║          Backup ID: ${BACKUP_ID}                                       "
  echo "╠══════════════════════════════════════════════════════════════╣"
  echo "║  Checksum Verification:  $(printf "%-15s" "${checksum_pass}")                         ║"
  echo "║  File Integrity:         $(printf "%-15s" "${integrity_pass}")                         ║"
  echo "║  Scope Completeness:     $(printf "%-15s" "${scope_pass}")                         ║"
  echo "║  Restore Dry Run:        $(printf "%-15s" "${restore_pass}")                         ║"
  echo "╠══════════════════════════════════════════════════════════════╣"
  echo "║  Log: ${LOG_FILE}  ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
}

cleanup() {
  log "Cleaning up working directory: ${WORK_DIR}"
  rm -rf "${WORK_DIR}"
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
  check_dependency curl
  check_dependency jq
  check_dependency sha256sum

  if [ -z "${ADMIN_TOKEN}" ]; then
    echo "WARNING: ADMIN_TOKEN not set. Some API calls may fail."
  fi

  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║          Backup Verification: ID ${BACKUP_ID}                           "
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""

  local checksum_pass="SKIP"
  local integrity_pass="SKIP"
  local scope_pass="SKIP"
  local restore_pass="SKIP"

  verify_backup_exists "${BACKUP_ID}"

  download_backup "${BACKUP_ID}" "${WORK_DIR}"

  if verify_checksum "${WORK_DIR}" "${BACKUP_CHECKSUM}"; then
    checksum_pass="PASS"
  else
    checksum_pass="FAIL"
  fi

  if verify_file_integrity "${WORK_DIR}"; then
    integrity_pass="PASS"
  else
    integrity_pass="FAIL"
  fi

  if verify_data_sampling "${WORK_DIR}"; then
    true
  fi

  if verify_backup_scope "${BACKUP_SCOPE}" "${WORK_DIR}"; then
    scope_pass="PASS"
  else
    scope_pass="FAIL"
  fi

  if run_restore_dry_run "${BACKUP_ID}"; then
    restore_pass="PASS"
  else
    restore_pass="FAIL"
  fi

  report_results "${checksum_pass}" "${integrity_pass}" "${scope_pass}" "${restore_pass}"

  cleanup

  if [ "${checksum_pass}" = "FAIL" ] || [ "${integrity_pass}" = "FAIL" ] || \
     [ "${scope_pass}" = "FAIL" ] || [ "${restore_pass}" = "FAIL" ]; then
    exit 1
  fi
}

trap cleanup EXIT
main "$@"
