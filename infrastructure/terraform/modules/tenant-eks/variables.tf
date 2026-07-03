variable "tenant_id" {
  description = "Tenant identifier"
  type        = string
}

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

variable "node_instance_type" {
  description = "EC2 instance type for tenant node group"
  type        = string
  default     = "t3.medium"
}

variable "node_desired_size" {
  description = "Desired node count"
  type        = number
  default     = 2
}

variable "node_min_size" {
  description = "Minimum node count"
  type        = number
  default     = 1
}

variable "node_max_size" {
  description = "Maximum node count"
  type        = number
  default     = 4
}

variable "node_disk_size" {
  description = "Disk size in GB"
  type        = number
  default     = 50
}

variable "cluster_log_retention_days" {
  description = "Retention for EKS control plane logs"
  type        = number
  default     = 14
}

variable "vpc_cidr_block" {
  description = "CIDR block of the VPC for security group ingress"
  type        = string
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
