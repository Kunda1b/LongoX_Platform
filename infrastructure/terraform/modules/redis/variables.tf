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
  description = "Number of cache clusters in replication group (used when cluster_mode_enabled=false)"
  type        = number
  default     = 2
}

variable "multi_az_enabled" {
  description = "Enable Multi-AZ"
  type        = bool
  default     = false
}

variable "cluster_mode_enabled" {
  description = "Enable cluster mode. When true, provisions `num_node_groups` shards each with `replicas_per_node_group` replicas."
  type        = bool
  default     = true
}

variable "num_shards" {
  description = "Number of shards / node groups (cluster mode only). Architecture default is 3 (3 primary + 3 replica)."
  type        = number
  default     = 3
}

variable "replicas_per_node_group" {
  description = "Number of read replicas per shard (cluster mode only). Architecture default is 1 (3 primary + 3 replica)."
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
