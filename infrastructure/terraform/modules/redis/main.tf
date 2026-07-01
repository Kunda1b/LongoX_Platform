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

  automatic_failover_enabled = var.num_cache_clusters > 1
  multi_az_enabled           = var.multi_az_enabled && var.num_cache_clusters > 1

  num_cache_clusters         = var.num_cache_clusters

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  auto_minor_version_upgrade = true

  maintenance_window = "sun:05:00-sun:06:00"
  snapshot_window    = "03:00-04:00"
  snapshot_retention_limit = var.snapshot_retention_days

  kms_key_id = var.kms_key_id

  tags = local.common_tags
}

resource "aws_elasticache_cluster" "replica" {
  count = var.cluster_mode_enabled ? var.num_shards : 0

  cluster_id           = "longox-redis-${var.environment}-shard-${count.index}"
  replication_group_id = aws_elasticache_replication_group.main.id
}
