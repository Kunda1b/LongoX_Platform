terraform {
  backend "s3" {
    bucket         = "longox-terraform-state"
    key            = "environments/prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "longox-terraform-locks"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

module "networking" {
  source = "../../modules/networking"
  environment = "prod"
  vpc_cidr = "10.2.0.0/16"
  public_subnet_cidrs  = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
  private_subnet_cidrs = ["10.2.10.0/24", "10.2.11.0/24", "10.2.12.0/24"]
}

module "postgres" {
  source = "../../modules/postgres"
  environment      = "prod"
  vpc_id           = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  instance_class   = "db.r6g.large"
  allocated_storage = 100
  database_name    = "longox"
  master_username  = "longox_admin"
  multi_az         = true
  backup_retention_period = 30
  deletion_protection     = true
}

module "redis" {
  source = "../../modules/redis"
  environment        = "prod"
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  node_type          = "cache.r6g.large"
  num_cache_nodes    = 3
  multi_az           = true
}

module "eks" {
  source = "../../modules/eks"
  environment        = "prod"
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  public_subnet_ids  = module.networking.public_subnet_ids
  cluster_version    = "1.28"
  node_instance_types = ["t3.large", "t3.xlarge"]
  desired_size       = 5
  min_size           = 3
  max_size           = 10
}

module "monitoring" {
  source = "../../modules/monitoring"
  environment = "prod"
  eks_cluster_name = module.eks.cluster_name
  alert_email      = "devops@longox.io"
  retention_days   = 90
}

module "vault" {
  source = "../../modules/vault"
  environment = "prod"
  eks_cluster_name = module.eks.cluster_name
  auto_unseal      = true
}
