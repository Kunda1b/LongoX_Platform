terraform {
  backend "s3" {
    bucket         = "longox-terraform-state"
    key            = "environments/staging/terraform.tfstate"
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
  environment = "staging"
  vpc_cidr = "10.1.0.0/16"
  public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
  private_subnet_cidrs = ["10.1.10.0/24", "10.1.11.0/24"]
}

module "postgres" {
  source = "../../modules/postgres"
  environment      = "staging"
  vpc_id           = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  instance_class   = "db.t3.large"
  allocated_storage = 50
  database_name    = "longox"
  master_username  = "longox_admin"
  multi_az         = true
}

module "redis" {
  source = "../../modules/redis"
  environment        = "staging"
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  node_type          = "cache.t3.small"
  num_cache_nodes    = 2
}

module "eks" {
  source = "../../modules/eks"
  environment        = "staging"
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  public_subnet_ids  = module.networking.public_subnet_ids
  cluster_version    = "1.28"
  node_instance_types = ["t3.large"]
  desired_size       = 3
  min_size           = 2
  max_size           = 6
}

module "monitoring" {
  source = "../../modules/monitoring"
  environment = "staging"
  eks_cluster_name = module.eks.cluster_name
  alert_email      = "devops@flowbuilder.io"
}

module "vault" {
  source = "../../modules/vault"
  environment = "staging"
  eks_cluster_name = module.eks.cluster_name
}
