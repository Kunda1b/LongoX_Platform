variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "instance_class" { type = string }
variable "allocated_storage" { type = number }
variable "database_name" { type = string }
variable "master_username" { type = string }
variable "multi_az" { type = bool, default = false }
variable "backup_retention_period" { type = number, default = 7 }
variable "deletion_protection" { type = bool, default = false }

resource "aws_db_subnet_group" "main" {
  name       = "longox-${var.environment}"
  subnet_ids = var.private_subnet_ids
}

resource "aws_security_group" "rds" {
  name        = "longox-rds-${var.environment}"
  description = "RDS security group"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    cidr_blocks     = [var.vpc_cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "main" {
  identifier     = "longox-${var.environment}"
  engine         = "postgres"
  engine_version = "16.3"

  instance_class        = var.instance_class
  allocated_storage     = var.allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.database_name
  username = var.master_username
  password = random_password.master.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  multi_az                      = var.multi_az
  backup_retention_period       = var.backup_retention_period
  backup_window                 = "03:00-04:00"
  maintenance_window            = "sun:04:00-sun:05:00"
  deletion_protection           = var.deletion_protection
  skip_final_snapshot           = var.environment != "prod"
  final_snapshot_identifier     = var.environment == "prod" ? "longox-${var.environment}-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  performance_insights_enabled = var.environment == "prod"
  monitoring_interval          = var.environment == "prod" ? 60 : 0

  parameter_group_name = aws_db_parameter_group.main.name
}

resource "aws_db_parameter_group" "main" {
  name   = "longox-${var.environment}-pg"
  family = "postgres16"

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements,auto_explain"
  }
}

resource "random_password" "master" {
  length  = 24
  special = false
}

output "endpoint" {
  value = aws_db_instance.main.endpoint
}

output "port" {
  value = 5432
}

output "database_name" {
  value = var.database_name
}

output "master_username" {
  value = var.master_username
}
