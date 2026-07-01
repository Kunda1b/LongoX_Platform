variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "backup_resource_arns" {
  description = "List of ARNs to backup"
  type        = list(string)
  default     = []
}

variable "exclude_resource_arns" {
  description = "List of ARNs to exclude from backup"
  type        = list(string)
  default     = []
}

variable "retention_days" {
  description = "Daily backup retention in days"
  type        = number
  default     = 35
}

variable "weekly_retention_days" {
  description = "Weekly backup retention in days"
  type        = number
  default     = 90
}

variable "monthly_retention_days" {
  description = "Monthly backup retention in days"
  type        = number
  default     = 365
}

variable "cold_storage_after_days" {
  description = "Days before moving to cold storage"
  type        = number
  default     = 90
}

variable "cross_region_destination_vault_arn" {
  description = "ARN of destination vault for cross-region replication"
  type        = string
  default     = ""
}

variable "cross_region_retention_days" {
  description = "Retention for cross-region copies"
  type        = number
  default     = 35
}

variable "sns_topic_arn" {
  description = "SNS topic ARN for backup notifications"
  type        = string
  default     = ""
}

variable "backup_vault_events" {
  description = "List of backup events to notify on"
  type        = list(string)
  default     = ["BACKUP_JOB_COMPLETED", "RESTORE_JOB_COMPLETED", "COPY_JOB_COMPLETED"]
}

variable "enable_vault_lock" {
  description = "Enable vault lock (WORM)"
  type        = bool
  default     = false
}

variable "vault_lock_changeable_days" {
  description = "Days before vault lock becomes immutable"
  type        = number
  default     = 3
}

variable "vault_lock_max_retention_days" {
  description = "Maximum retention days for vault lock"
  type        = number
  default     = 3650
}

variable "vault_lock_min_retention_days" {
  description = "Minimum retention days for vault lock"
  type        = number
  default     = 1
}
