# =============================================================================
# LongoX Tenant Provisioning Root Module
# =============================================================================
# Usage: terraform apply -var="tenant_id=42" -var="tier=dedicated-namespace"
#
# Tiers:
#   shared            - No infra provisioning (uses shared cluster namespace)
#   dedicated-namespace - Per-tenant Kubernetes namespace (handled by app)
#   dedicated-cluster - Full per-tenant VPC + EKS cluster + RDS
# =============================================================================

variable "tenant_id" {
  description = "Numeric tenant identifier"
  type        = number
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "tier" {
  description = "Tenant isolation tier"
  type        = string
  default     = "dedicated-namespace"
  validation {
    condition     = contains(["shared", "dedicated-namespace", "dedicated-cluster"], var.tier)
    error_message = "Tier must be one of: shared, dedicated-namespace, dedicated-cluster"
  }
}

variable "cluster_version" {
  description = "Kubernetes version for tenant EKS cluster"
  type        = string
  default     = "1.28"
}

variable "node_instance_type" {
  description = "EC2 instance type for tenant node group"
  type        = string
  default     = "t3.medium"
}

variable "node_desired_size" {
  description = "Desired node count for tenant cluster"
  type        = number
  default     = 2
}

variable "node_min_size" {
  description = "Minimum node count"
  type        = number
  default     = 1
}

variable "node_max_size" {
  description = "Maximum node count"
  type        = number
  default     = 4
}

locals {
  tenant_id_str = tostring(var.tenant_id)
}

module "networking" {
  count  = var.tier == "dedicated-cluster" ? 1 : 0
  source = "../modules/tenant-networking"

  tenant_id           = local.tenant_id_str
  environment         = var.environment
  vpc_cidr            = "10.${var.tenant_id}.0.0/16"
  public_subnet_cidrs  = ["10.${var.tenant_id}.1.0/24", "10.${var.tenant_id}.2.0/24"]
  private_subnet_cidrs = ["10.${var.tenant_id}.3.0/24", "10.${var.tenant_id}.4.0/24"]
  single_nat_gateway  = var.environment == "dev" ? true : false
  enable_flow_logs    = var.environment != "dev"
}

module "eks" {
  count  = var.tier == "dedicated-cluster" ? 1 : 0
  source = "../modules/tenant-eks"

  tenant_id          = local.tenant_id_str
  environment        = var.environment
  vpc_id             = module.networking[0].vpc_id
  vpc_cidr_block     = module.networking[0].vpc_cidr_block
  private_subnet_ids = module.networking[0].private_subnet_ids
  cluster_version    = var.cluster_version
  node_instance_type   = var.node_instance_type
  node_desired_size    = var.node_desired_size
  node_min_size        = var.node_min_size
  node_max_size        = var.node_max_size
}

module "database" {
  count  = var.tier == "dedicated-cluster" ? 1 : 0
  source = "../modules/tenant-database"

  tenant_id          = local.tenant_id_str
  environment        = var.environment
  vpc_id             = module.networking[0].vpc_id
  vpc_cidr_block     = module.networking[0].vpc_cidr_block
  private_subnet_ids = module.networking[0].private_subnet_ids
  deletion_protection = var.environment != "dev"
}

output "networking" {
  value = var.tier == "dedicated-cluster" ? {
    vpc_id     = module.networking[0].vpc_id
    subnet_ids = module.networking[0].private_subnet_ids
  } : null
}

output "cluster" {
  value = var.tier == "dedicated-cluster" ? {
    name     = module.eks[0].cluster_name
    endpoint = module.eks[0].cluster_endpoint
  } : null
}

output "database" {
  value = var.tier == "dedicated-cluster" ? {
    endpoint   = module.database[0].db_endpoint
    secret_arn = module.database[0].secret_arn
  } : null
}
