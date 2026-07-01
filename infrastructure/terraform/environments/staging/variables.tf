variable "environment" {
  description = "Environment name"
  type        = string
  default     = "staging"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.1.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDR blocks"
  type        = list(string)
  default     = ["10.1.1.0/20", "10.1.2.0/20", "10.1.3.0/20"]
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDR blocks"
  type        = list(string)
  default     = ["10.1.16.0/18", "10.1.80.0/18", "10.1.144.0/18"]
}

variable "single_nat_gateway" {
  description = "Use single NAT Gateway"
  type        = bool
  default     = false
}

variable "cluster_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "on_demand_instance_types" {
  description = "On-demand instance types"
  type        = list(string)
  default     = ["t3.large"]
}

variable "on_demand_desired_size" {
  description = "On-demand desired size"
  type        = number
  default     = 3
}

variable "on_demand_min_size" {
  description = "On-demand min size"
  type        = number
  default     = 2
}

variable "on_demand_max_size" {
  description = "On-demand max size"
  type        = number
  default     = 6
}

variable "enable_spot_node_group" {
  description = "Enable spot node group"
  type        = bool
  default     = true
}

variable "instance_class" {
  description = "Aurora instance class"
  type        = string
  default     = "db.r6g.large"
}

variable "aurora_reader_count" {
  description = "Number of Aurora readers"
  type        = number
  default     = 1
}

variable "redis_node_type" {
  description = "Redis node type"
  type        = string
  default     = "cache.r6g.large"
}

variable "redis_num_nodes" {
  description = "Number of Redis nodes"
  type        = number
  default     = 2
}

variable "alert_email" {
  description = "Alert email"
  type        = string
  default     = "devops@longox.io"
}

variable "root_domain" {
  description = "Root domain"
  type        = string
  default     = "longox.io"
}

variable "deploy_vault" {
  description = "Deploy Vault"
  type        = bool
  default     = true
}

variable "vault_auto_unseal" {
  description = "Vault auto-unseal"
  type        = bool
  default     = true
}

variable "deploy_kong" {
  description = "Deploy Kong"
  type        = bool
  default     = true
}

variable "enable_cross_region_replication" {
  description = "Enable cross-region replication"
  type        = bool
  default     = false
}
