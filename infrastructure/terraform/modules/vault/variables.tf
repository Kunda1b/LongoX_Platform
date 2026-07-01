variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "depends_on_cluster_name" {
  description = "EKS cluster name (dependency)"
  type        = string
  default     = ""
}

variable "deploy_vault" {
  description = "Deploy Vault via Helm"
  type        = bool
  default     = true
}

variable "auto_unseal" {
  description = "Enable auto-unseal with KMS"
  type        = bool
  default     = false
}

variable "vault_replicas" {
  description = "Number of Vault replicas"
  type        = number
  default     = 3
}

variable "vault_helm_version" {
  description = "Vault Helm chart version"
  type        = string
  default     = "0.27.0"
}

variable "enable_injector" {
  description = "Enable Vault agent injector"
  type        = bool
  default     = true
}

variable "use_secrets_manager" {
  description = "Store unseal keys in Secrets Manager"
  type        = bool
  default     = true
}

variable "vault_unseal_keys_json" {
  description = "JSON string of initial unseal keys (only used if use_secrets_manager is true)"
  type        = string
  default     = "{}"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}
