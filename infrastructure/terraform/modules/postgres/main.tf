locals {
  common_tags = {
    Environment = var.environment
    Project     = "LongoX"
    ManagedBy   = "Terraform"
    Owner       = "PlatformTeam"
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "longox-aurora-${var.environment}"
  subnet_ids = var.private_subnet_ids

  tags = local.common_tags
}

resource "aws_security_group" "rds" {
  name        = "longox-aurora-${var.environment}"
  description = "Aurora PostgreSQL security group"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    cidr_blocks     = [var.vpc_cidr_block]
    description     = "PostgreSQL from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.common_tags
}

resource "aws_rds_cluster_parameter_group" "main" {
  name        = "longox-aurora-${var.environment}-pg"
  family      = "aurora-postgresql16"
  description = "Aurora PostgreSQL parameter group for LongoX ${var.environment}"

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements,auto_explain,pg_hint_plan"
  }

  parameter {
    name  = "pg_stat_statements.track"
    value = "ALL"
  }

  parameter {
    name  = "auto_explain.log_min_duration"
    value = "5000"
  }

  tags = local.common_tags
}

resource "aws_rds_cluster" "main" {
  cluster_identifier              = "longox-aurora-${var.environment}"
  engine                          = "aurora-postgresql"
  engine_version                  = var.engine_version
  engine_mode                     = "provisioned"
  database_name                   = var.database_name
  master_username                 = var.master_username
  master_password                 = random_password.master.result
  manage_master_user_password     = false
  port                            = 5432
  db_subnet_group_name            = aws_db_subnet_group.main.name
  vpc_security_group_ids          = [aws_security_group.rds.id]
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.main.name

  backup_retention_period = var.backup_retention_period
  preferred_backup_window = "03:00-04:00"
  preferred_maintenance_window = "sun:04:00-sun:05:00"

  storage_encrypted  = true
  kms_key_id         = var.kms_key_id

  deletion_protection           = var.deletion_protection
  skip_final_snapshot           = var.environment != "production"
  final_snapshot_identifier     = var.environment == "production" ? "longox-aurora-${var.environment}-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = local.common_tags
}

resource "aws_rds_cluster_instance" "writer" {
  identifier          = "longox-aurora-${var.environment}-writer"
  cluster_identifier  = aws_rds_cluster.main.id
  instance_class      = var.instance_class
  engine              = aws_rds_cluster.main.engine
  engine_version      = aws_rds_cluster.main.engine_version
  db_subnet_group_name = aws_db_subnet_group.main.name

  auto_minor_version_upgrade = true
  performance_insights_enabled = var.performance_insights_enabled
  performance_insights_retention_period = var.performance_insights_enabled ? 7 : 0
  monitoring_interval  = var.monitoring_interval
  monitoring_role_arn  = var.monitoring_interval > 0 ? aws_iam_role.rds_enhanced_monitoring[0].arn : null

  tags = local.common_tags
}

resource "aws_rds_cluster_instance" "reader" {
  count = var.reader_count

  identifier          = "longox-aurora-${var.environment}-reader-${count.index}"
  cluster_identifier  = aws_rds_cluster.main.id
  instance_class      = var.instance_class
  engine              = aws_rds_cluster.main.engine
  engine_version      = aws_rds_cluster.main.engine_version
  db_subnet_group_name = aws_db_subnet_group.main.name
  promotion_tier      = count.index + 1

  auto_minor_version_upgrade = true
  performance_insights_enabled = var.performance_insights_enabled
  monitoring_interval  = var.monitoring_interval
  monitoring_role_arn  = var.monitoring_interval > 0 ? aws_iam_role.rds_enhanced_monitoring[0].arn : null

  tags = local.common_tags
}

resource "aws_iam_role" "rds_enhanced_monitoring" {
  count = var.monitoring_interval > 0 ? 1 : 0

  name = "longox-rds-monitoring-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "monitoring.rds.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  count = var.monitoring_interval > 0 ? 1 : 0

  role       = aws_iam_role.rds_enhanced_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

resource "random_password" "master" {
  length  = 24
  special = false
}

resource "aws_secretsmanager_secret" "database" {
  name = "longox-aurora-${var.environment}"

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({
    username         = var.master_username
    password         = random_password.master.result
    engine           = "aurora-postgresql"
    port             = 5432
    dbname           = var.database_name
    host             = aws_rds_cluster.main.endpoint
    reader_endpoint  = aws_rds_cluster.main.reader_endpoint
    connection_string = "postgresql://${var.master_username}:${urlencode(random_password.master.result)}@${aws_rds_cluster.main.endpoint}:5432/${var.database_name}"
  })
}
