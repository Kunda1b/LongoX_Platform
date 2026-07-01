locals {
  common_tags = {
    Environment = var.environment
    Project     = "LongoX"
    ManagedBy   = "Terraform"
    Owner       = "PlatformTeam"
  }
}

resource "aws_backup_vault" "main" {
  name        = "longox-${var.environment}-backup-vault"
  kms_key_arn = aws_kms_key.backup_vault.arn

  tags = local.common_tags
}

resource "aws_kms_key" "backup_vault" {
  description             = "Backup vault KMS key for ${var.environment}"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = local.common_tags
}

resource "aws_kms_alias" "backup_vault" {
  name          = "alias/longox-${var.environment}-backup-vault"
  target_key_id = aws_kms_key.backup_vault.key_id
}

resource "aws_backup_plan" "main" {
  name = "longox-${var.environment}-backup-plan"

  rule {
    rule_name         = "daily-backups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 5 * * ? *)"
    start_window      = 60
    completion_window = 120
    recovery_point_tags = {
      Environment = var.environment
      Type        = "daily-backup"
    }

    lifecycle {
      cold_storage_after = var.cold_storage_after_days
      delete_after       = var.retention_days
    }

    copy_action {
      destination_vault_arn = var.cross_region_destination_vault_arn != "" ? var.cross_region_destination_vault_arn : aws_backup_vault.main.arn
      lifecycle {
        delete_after = var.cross_region_retention_days
      }
    }
  }

  rule {
    rule_name         = "weekly-backups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 6 ? * SUN *)"
    start_window      = 60
    completion_window = 120

    lifecycle {
      cold_storage_after = var.cold_storage_after_days
      delete_after       = var.weekly_retention_days
    }
  }

  rule {
    rule_name         = "monthly-backups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 7 1 * ? *)"
    start_window      = 60
    completion_window = 120

    lifecycle {
      cold_storage_after = var.cold_storage_after_days
      delete_after       = var.monthly_retention_days
    }
  }

  tags = local.common_tags
}

resource "aws_backup_selection" "resources" {
  name         = "longox-${var.environment}-backup-selection"
  plan_id      = aws_backup_plan.main.id
  iam_role_arn = aws_iam_role.backup.arn
  resources    = var.backup_resource_arns
  not_resources = var.exclude_resource_arns

  selection_tag {
    type  = "STRING_EQUALS"
    key   = "BackupPlan"
    value = "longox-${var.environment}"
  }
}

resource "aws_backup_vault_notifications" "main" {
  backup_vault_name   = aws_backup_vault.main.name
  sns_topic_arn       = var.sns_topic_arn
  backup_vault_events = var.backup_vault_events
}

resource "aws_backup_vault_lock_configuration" "main" {
  count = var.enable_vault_lock ? 1 : 0

  backup_vault_name   = aws_backup_vault.main.name
  changeable_for_days = var.vault_lock_changeable_days
  max_retention_days  = var.vault_lock_max_retention_days
  min_retention_days  = var.vault_lock_min_retention_days
}

resource "aws_iam_role" "backup" {
  name = "longox-backup-service-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "backup.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "backup" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
  role       = aws_iam_role.backup.name
}

resource "aws_iam_role_policy_attachment" "backup_restore" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
  role       = aws_iam_role.backup.name
}
