output "api_key_secret_arn" {
  value = aws_secretsmanager_secret.workos_api_key.arn
}

output "client_id_secret_arn" {
  value = aws_secretsmanager_secret.workos_client_id.arn
}

output "webhook_secret_arn" {
  value = aws_secretsmanager_secret.workos_webhook_secret.arn
}

output "iam_policy_arn" {
  value = aws_iam_policy.workos_secrets_access.arn
}
