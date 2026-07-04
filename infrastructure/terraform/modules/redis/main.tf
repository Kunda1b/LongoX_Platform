locals {
  common_tags = {
    Environment = var.environment
    Project     = "LongoX"
    ManagedBy   = "Terraform"
    Owner       = "PlatformTeam"
  }
}

resource "aws_elasticache_subnet_group" "main" {
  name       = "longox-redis-${var.environment}"
  subnet_ids = var.private_subnet_ids

  tags = local.common_tags
}

resource "aws_security_group" "redis" {
  name        = "longox-redis-${var.environment}"
  description = "Redis security group"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    cidr_blocks     = [var.vpc_cidr_block]
    description     = "Redis from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.common_tags
}

resource "aws_elasticache_parameter_group" "main" {
  name   = "longox-redis-${var.environment}"
  family = "redis7"

  parameter {
    name  = "cluster-enabled"
    value = var.cluster_mode_enabled ? "yes" : "no"
  }

  parameter {
    name  = "timeout"
    value = "300"
  }

  parameter {
    name  = "maxmemory-policy"
    value = var.maxmemory_policy
  }

  tags = local.common_tags
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id          = "longox-redis-${var.environment}"
  description                   = "Redis cluster for LongoX ${var.environment}"

  node_type            = var.node_type
  port                 = 6379

  subnet_group_name          = aws_elasticache_subnet_group.main.name
  security_group_ids         = [aws_security_group.redis.id]
  parameter_group_name       = aws_elasticache_parameter_group.main.name

  # ─── Cluster mode: 3 primary shards + 1 replica each (3+3 total) ───────────
  # When cluster_mode_enabled=true we set num_node_groups (shards) and
  # replicas_per_node_group. The architecture default (3 primary + 3 replica)
  # gives us read scalability and survives the loss of a single shard's
  # primary without interrupting writes (ElastiCache promotes the replica).
  automatic_failover_enabled = var.cluster_mode_enabled ? true : var.num_cache_clusters > 1
  multi_az_enabled           = var.multi_az_enabled && (var.cluster_mode_enabled || var.num_cache_clusters > 1)

  # Cluster-mode topology (mutually exclusive with num_cache_clusters).
  num_node_groups            = var.cluster_mode_enabled ? var.num_shards : null
  replicas_per_node_group    = var.cluster_mode_enabled ? var.replicas_per_node_group : null

  # Non-cluster-mode topology (single shard with N read replicas).
  num_cache_clusters         = var.cluster_mode_enabled ? null : var.num_cache_clusters

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  auto_minor_version_upgrade = true

  maintenance_window = "sun:05:00-sun:06:00"
  snapshot_window    = "03:00-04:00"
  snapshot_retention_limit = var.snapshot_retention_days

  kms_key_id = var.kms_key_id

  tags = local.common_tags
}

# Per-shard clusters are only provisioned in non-cluster-mode (the
# replication group's `num_node_groups` already declares the shards when
# cluster mode is on). Keeping this resource for the legacy single-shard
# path so existing environments that pinned cluster_mode_enabled=false
# continue to provision one explicit replica cluster per shard.
resource "aws_elasticache_cluster" "replica" {
  count = var.cluster_mode_enabled ? 0 : var.num_shards

  cluster_id           = "longox-redis-${var.environment}-shard-${count.index}"
  replication_group_id = aws_elasticache_replication_group.main.id
}
