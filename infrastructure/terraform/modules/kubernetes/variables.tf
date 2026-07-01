variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "cluster_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "on_demand_instance_types" {
  description = "Instance types for on-demand node group"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "spot_instance_types" {
  description = "Instance types for spot node group"
  type        = list(string)
  default     = ["t3.medium", "t3.large", "t3a.medium", "t3a.large"]
}

variable "on_demand_desired_size" {
  description = "Desired size for on-demand node group"
  type        = number
  default     = 2
}

variable "on_demand_min_size" {
  description = "Minimum size for on-demand node group"
  type        = number
  default     = 1
}

variable "on_demand_max_size" {
  description = "Maximum size for on-demand node group"
  type        = number
  default     = 5
}

variable "spot_desired_size" {
  description = "Desired size for spot node group"
  type        = number
  default     = 0
}

variable "spot_min_size" {
  description = "Minimum size for spot node group"
  type        = number
  default     = 0
}

variable "spot_max_size" {
  description = "Maximum size for spot node group"
  type        = number
  default     = 10
}

variable "node_disk_size" {
  description = "Disk size in GB for node group instances"
  type        = number
  default     = 50
}

variable "enable_spot_node_group" {
  description = "Enable spot node group"
  type        = bool
  default     = false
}

variable "cluster_log_retention_days" {
  description = "Retention days for EKS cluster logs"
  type        = number
  default     = 30
}

variable "oidc_thumbprint" {
  description = "Thumbprint for OIDC provider"
  type        = string
  default     = "9e99a48a9960b14926bb7f3b02e22da2b0ab7280"
}
