variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "vpc_cidr_block" {
  description = "VPC CIDR block"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.r6g.large"
}

variable "num_cache_clusters" {
  description = "Number of cache clusters in replication group"
  type        = number
  default     = 2
}

variable "multi_az_enabled" {
  description = "Enable Multi-AZ"
  type        = bool
  default     = false
}

variable "cluster_mode_enabled" {
  description = "Enable cluster mode"
  type        = bool
  default     = false
}

variable "num_shards" {
  description = "Number of shards (cluster mode only)"
  type        = number
  default     = 1
}

variable "snapshot_retention_days" {
  description = "Snapshot retention limit in days"
  type        = number
  default     = 7
}

variable "maxmemory_policy" {
  description = "Maxmemory policy"
  type        = string
  default     = "allkeys-lru"
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
  default     = null
}
