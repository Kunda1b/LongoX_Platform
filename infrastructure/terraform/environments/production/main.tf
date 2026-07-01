terraform {
  backend "s3" {
    bucket         = "longox-terraform-state"
    key            = "environments/production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "longox-terraform-locks"
  }
}

locals {
  environment = "production"
}

module "networking" {
  source = "../../modules/networking"

  environment           = local.environment
  vpc_cidr              = var.vpc_cidr
  public_subnet_cidrs   = var.public_subnet_cidrs
  private_subnet_cidrs  = var.private_subnet_cidrs
  single_nat_gateway    = var.single_nat_gateway
  enable_flow_logs      = true
  flow_logs_retention_days = 90
}

module "postgres" {
  source = "../../modules/postgres"

  environment        = local.environment
  vpc_id             = module.networking.vpc_id
  vpc_cidr_block     = module.networking.vpc_cidr_block
  private_subnet_ids = module.networking.private_subnet_ids
  instance_class     = var.instance_class
  database_name      = "longox"
  master_username    = "longox_admin"
  deletion_protection = true
  reader_count       = var.aurora_reader_count
  backup_retention_period = 35
}

module "redis" {
  source = "../../modules/redis"

  environment        = local.environment
  vpc_id             = module.networking.vpc_id
  vpc_cidr_block     = module.networking.vpc_cidr_block
  private_subnet_ids = module.networking.private_subnet_ids
  node_type          = var.redis_node_type
  num_cache_clusters = var.redis_num_nodes
  multi_az_enabled   = true
  snapshot_retention_days = 14
}

module "kubernetes" {
  source = "../../modules/kubernetes"

  environment                = local.environment
  vpc_id                     = module.networking.vpc_id
  private_subnet_ids         = module.networking.private_subnet_ids
  cluster_version            = var.cluster_version
  on_demand_instance_types   = var.on_demand_instance_types
  on_demand_desired_size     = var.on_demand_desired_size
  on_demand_min_size         = var.on_demand_min_size
  on_demand_max_size         = var.on_demand_max_size
  enable_spot_node_group     = var.enable_spot_node_group
  cluster_log_retention_days = 90
}

module "object_storage" {
  source = "../../modules/object-storage"

  environment                   = local.environment
  enable_cross_region_replication = var.enable_cross_region_replication
  replication_region            = var.replication_region
}

module "observability" {
  source = "../../modules/observability"

  environment           = local.environment
  depends_on_cluster_name = module.kubernetes.cluster_name
  alert_email           = var.alert_email
  root_domain           = var.root_domain
  log_retention_days    = 90
  deploy_loki           = true
  deploy_tempo          = true
  prometheus_retention_days = 90
}

module "vault" {
  source = "../../modules/vault"

  environment           = local.environment
  depends_on_cluster_name = module.kubernetes.cluster_name
  deploy_vault          = var.deploy_vault
  auto_unseal           = var.vault_auto_unseal
}

module "kong" {
  source = "../../modules/kong"

  environment           = local.environment
  vpc_id                = module.networking.vpc_id
  vpc_cidr_block        = module.networking.vpc_cidr_block
  depends_on_cluster_name = module.kubernetes.cluster_name
  deploy_kong           = var.deploy_kong
  kong_replicas         = 3
}

module "backup_storage" {
  source = "../../modules/backup-storage"

  environment   = local.environment
  sns_topic_arn = module.observability.sns_topic_arn
  retention_days = 35
  weekly_retention_days  = 90
  monthly_retention_days = 365
  enable_vault_lock      = true
}
