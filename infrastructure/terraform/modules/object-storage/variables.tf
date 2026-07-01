variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "export_expiration_days" {
  description = "Days after which exports expire"
  type        = number
  default     = 30
}

variable "enable_cross_region_replication" {
  description = "Enable cross-region replication for backups"
  type        = bool
  default     = false
}

variable "replication_region" {
  description = "AWS region for backup replication"
  type        = string
  default     = ""
}

variable "force_destroy" {
  description = "Force destroy buckets even if non-empty"
  type        = bool
  default     = false
}
