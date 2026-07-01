variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "workos_api_key" {
  description = "WorkOS API key"
  type        = string
  sensitive   = true
}

variable "workos_client_id" {
  description = "WorkOS client ID"
  type        = string
  sensitive   = true
}

variable "workos_webhook_secret" {
  description = "WorkOS webhook secret"
  type        = string
  sensitive   = true
}

variable "enable_directory_sync" {
  description = "Enable WorkOS directory sync"
  type        = bool
  default     = false
}

variable "workos_directory_sync_secret" {
  description = "WorkOS directory sync secret"
  type        = string
  default     = ""
  sensitive   = true
}

variable "schedule_directory_sync" {
  description = "Schedule directory sync via CloudWatch"
  type        = bool
  default     = false
}

variable "directory_sync_schedule" {
  description = "CloudWatch schedule expression for directory sync"
  type        = string
  default     = "rate(1 hour)"
}

variable "directory_sync_lambda_arn" {
  description = "Lambda ARN for directory sync"
  type        = string
  default     = ""
}

variable "create_api_gateway_webhook" {
  description = "Create API Gateway webhook for WorkOS"
  type        = bool
  default     = false
}

variable "api_gateway_id" {
  description = "API Gateway ID"
  type        = string
  default     = ""
}

variable "api_gateway_root_resource_id" {
  description = "API Gateway root resource ID"
  type        = string
  default     = ""
}
