output "vault_kms_key_id" {
  value = var.auto_unseal ? aws_kms_key.vault[0].key_id : null
}

output "vault_kms_key_arn" {
  value = var.auto_unseal ? aws_kms_key.vault[0].arn : null
}

output "secrets_manager_secret_arn" {
  value = var.use_secrets_manager ? aws_secretsmanager_secret.vault_unseal[0].arn : null
}
