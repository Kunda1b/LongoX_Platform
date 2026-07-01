output "vpc_id" {
  value = module.networking.vpc_id
}

output "vpc_cidr_block" {
  value = module.networking.vpc_cidr_block
}

output "public_subnet_ids" {
  value = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  value = module.networking.private_subnet_ids
}

output "eks_cluster_name" {
  value = module.kubernetes.cluster_name
}

output "eks_cluster_endpoint" {
  value = module.kubernetes.cluster_endpoint
}

output "eks_cluster_arn" {
  value = module.kubernetes.cluster_arn
}

output "eks_oidc_provider_arn" {
  value = module.kubernetes.oidc_provider_arn
}

output "eks_oidc_provider_url" {
  value = module.kubernetes.oidc_provider_url
}

output "aurora_endpoint" {
  value = module.postgres.endpoint
}

output "aurora_reader_endpoint" {
  value = module.postgres.reader_endpoint
}

output "aurora_secret_arn" {
  value = module.postgres.secret_arn
}

output "redis_primary_endpoint" {
  value = module.redis.primary_endpoint
}

output "redis_reader_endpoint" {
  value = module.redis.reader_endpoint
}

output "app_data_bucket" {
  value = module.object_storage.app_data_bucket_id
}

output "backups_bucket" {
  value = module.object_storage.backups_bucket_id
}

output "archives_bucket" {
  value = module.object_storage.archives_bucket_id
}

output "exports_bucket" {
  value = module.object_storage.exports_bucket_id
}

output "sns_topic_arn" {
  value = module.observability.sns_topic_arn
}

output "backup_vault_name" {
  value = module.backup_storage.backup_vault_name
}

output "backup_vault_arn" {
  value = module.backup_storage.backup_vault_arn
}

output "workos_secrets_policy_arn" {
  value = module.workos.iam_policy_arn
}
