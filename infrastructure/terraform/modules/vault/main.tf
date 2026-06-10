variable "environment" { type = string }
variable "eks_cluster_name" { type = string }
variable "auto_unseal" { type = bool, default = false }

resource "helm_release" "vault" {
  name       = "vault"
  repository = "https://helm.releases.hashicorp.com"
  chart      = "vault"
  version    = "0.27.0"
  namespace  = "vault"
  create_namespace = true

  values = [
    <<-EOT
global:
  enabled: true

server:
  affinity: ""
  ha:
    enabled: true
    replicas: 3
    raft: { enabled: true, setNodeId: true, config: |
      ui = true
      listener "tcp" {
        address = "0.0.0.0:8200"
        cluster_address = "0.0.0.0:8201"
        tls_disable = true
      }
      storage "raft" {
        path = "/vault/data"
        retry_join {
          leader_api_addr = "http://vault-0.vault-internal:8200"
        }
        retry_join {
          leader_api_addr = "http://vault-1.vault-internal:8200"
        }
        retry_join {
          leader_api_addr = "http://vault-2.vault-internal:8200"
        }
      }
      seal "awskms" {
        region = "us-east-1"
        kms_key_id = "${var.auto_unseal ? aws_kms_key.vault[0].key_id : ""}"
      }
    }

ui:
  enabled: true
  serviceType: ClusterIP
EOT
  ]

  depends_on = [var.eks_cluster_name]
}

resource "aws_kms_key" "vault" {
  count = var.auto_unseal ? 1 : 0
  description             = "Vault auto-unseal key for ${var.environment}"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}
