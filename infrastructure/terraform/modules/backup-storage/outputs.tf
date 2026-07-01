output "backup_vault_name" {
  value = aws_backup_vault.main.name
}

output "backup_vault_arn" {
  value = aws_backup_vault.main.arn
}

output "backup_plan_id" {
  value = aws_backup_plan.main.id
}

output "backup_iam_role_arn" {
  value = aws_iam_role.backup.arn
}

output "backup_kms_key_arn" {
  value = aws_kms_key.backup_vault.arn
}
