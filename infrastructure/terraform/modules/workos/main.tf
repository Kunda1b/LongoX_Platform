locals {
  common_tags = {
    Environment = var.environment
    Project     = "LongoX"
    ManagedBy   = "Terraform"
    Owner       = "PlatformTeam"
  }
}

resource "aws_secretsmanager_secret" "workos_api_key" {
  name = "longox-workos-api-key-${var.environment}"

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "workos_api_key" {
  secret_id     = aws_secretsmanager_secret.workos_api_key.id
  secret_string = var.workos_api_key
}

resource "aws_secretsmanager_secret" "workos_client_id" {
  name = "longox-workos-client-id-${var.environment}"

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "workos_client_id" {
  secret_id     = aws_secretsmanager_secret.workos_client_id.id
  secret_string = var.workos_client_id
}

resource "aws_secretsmanager_secret" "workos_webhook_secret" {
  name = "longox-workos-webhook-secret-${var.environment}"

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "workos_webhook_secret" {
  secret_id     = aws_secretsmanager_secret.workos_webhook_secret.id
  secret_string = var.workos_webhook_secret
}

resource "aws_secretsmanager_secret" "workos_directory_sync_secret" {
  count = var.enable_directory_sync ? 1 : 0

  name = "longox-workos-directory-sync-${var.environment}"

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "workos_directory_sync_secret" {
  count = var.enable_directory_sync ? 1 : 0

  secret_id     = aws_secretsmanager_secret.workos_directory_sync_secret[0].id
  secret_string = var.workos_directory_sync_secret
}

resource "aws_cloudwatch_event_rule" "workos_webhook_schedule" {
  count = var.schedule_directory_sync ? 1 : 0

  name                = "longox-workos-directory-sync-${var.environment}"
  description         = "Trigger WorkOS directory sync"
  schedule_expression = var.directory_sync_schedule

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "workos_webhook_target" {
  count = var.schedule_directory_sync ? 1 : 0

  rule      = aws_cloudwatch_event_rule.workos_webhook_schedule[0].name
  arn       = var.directory_sync_lambda_arn
  input     = jsonencode({
    action = "sync_directories"
  })
}

resource "aws_api_gateway_resource" "webhook" {
  count = var.create_api_gateway_webhook ? 1 : 0

  rest_api_id = var.api_gateway_id
  parent_id   = var.api_gateway_root_resource_id
  path_part   = "workos-webhook"
}

resource "aws_api_gateway_method" "webhook_post" {
  count = var.create_api_gateway_webhook ? 1 : 0

  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.webhook[0].id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "webhook_proxy" {
  count = var.create_api_gateway_webhook ? 1 : 0

  rest_api_id = var.api_gateway_id
  resource_id = aws_api_gateway_resource.webhook[0].id
  http_method = aws_api_gateway_method.webhook_post[0].http_method

  integration_http_method = "POST"
  type                    = "HTTP_PROXY"
  uri                     = "https://api.workos.com/webhooks"
  connection_type         = "INTERNET"
}

resource "aws_iam_policy" "workos_secrets_access" {
  name        = "longox-workos-secrets-access-${var.environment}"
  description = "Allow access to WorkOS secrets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.workos_api_key.arn,
          aws_secretsmanager_secret.workos_client_id.arn,
          aws_secretsmanager_secret.workos_webhook_secret.arn,
        ]
      }
    ]
  })

  tags = local.common_tags
}

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
