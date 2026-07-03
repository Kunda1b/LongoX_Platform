locals {
  common_tags = {
    Environment = var.environment
    Project     = "LongoX"
    ManagedBy   = "Terraform"
    Owner       = "PlatformTeam"
    TenantId    = var.tenant_id
  }
  all_tags = merge(local.common_tags, var.tags)
  prefix   = "longox-${var.environment}-tenant-${var.tenant_id}"
}

resource "aws_security_group" "rds" {
  name        = "${local.prefix}-rds-sg"
  description = "RDS security group for tenant ${var.tenant_id}"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_block]
  }

  tags = local.all_tags
}

resource "aws_db_subnet_group" "rds" {
  name        = "${local.prefix}-subnet-group"
  description = "RDS subnet group for tenant ${var.tenant_id}"
  subnet_ids  = var.private_subnet_ids
  tags        = local.all_tags
}

resource "aws_kms_key" "rds" {
  description             = "RDS encryption key for tenant ${var.tenant_id}"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags                    = local.all_tags
}

resource "aws_db_instance" "tenant" {
  identifier = "${local.prefix}-db"

  engine         = "postgres"
  engine_version = "16.3"
  instance_class = var.instance_class

  allocated_storage     = var.allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds.arn

  db_name  = var.database_name
  username = "longox_admin"
  password = random_password.master.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.rds.name

  backup_retention_period = var.backup_retention_days
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:05:00-sun:06:00"

  deletion_protection = var.deletion_protection
  skip_final_snapshot = var.deletion_protection ? false : true

  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  enabled_cloudwatch_logs_exports       = ["postgresql"]

  tags = local.all_tags
}

resource "random_password" "master" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "rds" {
  name        = "${local.prefix}-rds-credentials"
  description = "RDS master credentials for tenant ${var.tenant_id}"
  tags        = local.all_tags
}

resource "aws_secretsmanager_secret_version" "rds" {
  secret_id = aws_secretsmanager_secret.rds.id
  secret_string = jsonencode({
    username = aws_db_instance.tenant.username
    password = random_password.master.result
    host     = aws_db_instance.tenant.address
    port     = aws_db_instance.tenant.port
    dbname   = aws_db_instance.tenant.db_name
  })
}
