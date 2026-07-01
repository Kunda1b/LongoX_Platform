locals {
  common_tags = {
    Environment = var.environment
    Project     = "LongoX"
    ManagedBy   = "Terraform"
    Owner       = "PlatformTeam"
  }

  retry_joins = join("\n", [for i in range(var.vault_replicas) : format("        retry_join {\n          leader_api_addr = \"http://vault-%d.vault-internal:8200\"\n        }", i)])
}

resource "aws_kms_key" "vault" {
  count = var.auto_unseal ? 1 : 0

  description             = "Vault auto-unseal KMS key - ${var.environment}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = local.common_tags
}

resource "aws_kms_alias" "vault" {
  count = var.auto_unseal ? 1 : 0

  name          = "alias/longox-${var.environment}-vault-unseal"
  target_key_id = aws_kms_key.vault[0].key_id
}

resource "aws_secretsmanager_secret" "vault_unseal" {
  count = var.use_secrets_manager ? 1 : 0

  name = "longox-vault-unseal-${var.environment}"

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "vault_unseal" {
  count = var.use_secrets_manager ? 1 : 0

  secret_id     = aws_secretsmanager_secret.vault_unseal[0].id
  secret_string = var.vault_unseal_keys_json
}

resource "helm_release" "vault" {
  count = var.deploy_vault ? 1 : 0

  name             = "vault"
  repository       = "https://helm.releases.hashicorp.com"
  chart            = "vault"
  version          = var.vault_helm_version
  namespace        = "vault"
  create_namespace = true
  timeout          = 600

  values = [
    <<-EOT
global:
  enabled: true

server:
  affinity: ""
  ha:
    enabled: true
    replicas: ${var.vault_replicas}
    raft:
      enabled: true
      setNodeId: true
      config: |
        ui = true
        listener "tcp" {
          address = "0.0.0.0:8200"
          cluster_address = "0.0.0.0:8201"
          tls_disable = true
        }
        storage "raft" {
          path = "/vault/data"
${indent(8, local.retry_joins)}
        }
        %{ if var.auto_unseal ~}
        seal "awskms" {
          region = "${var.aws_region}"
          kms_key_id = "${aws_kms_key.vault[0].key_id}"
        }
        %{ endif ~}
  service:
    enabled: true

ui:
  enabled: true
  serviceType: ClusterIP

injector:
  enabled: ${var.enable_injector}
EOT
  ]

  depends_on = [var.depends_on_cluster_name]
}
