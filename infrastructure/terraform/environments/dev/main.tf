terraform {
  backend "s3" {
    bucket         = "longox-terraform-state"
    key            = "environments/dev/terraform.tfstate"
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
  environment = "dev"
  vpc_cidr = "10.0.0.0/16"
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
}

module "postgres" {
  source = "../../modules/postgres"
  environment      = "dev"
  vpc_id           = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  instance_class   = "db.t3.medium"
  allocated_storage = 20
  database_name    = "longox"
  master_username  = "longox_admin"
}

module "redis" {
  source = "../../modules/redis"
  environment        = "dev"
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  node_type          = "cache.t3.micro"
  num_cache_nodes    = 1
}

module "eks" {
  source = "../../modules/eks"
  environment        = "dev"
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  public_subnet_ids  = module.networking.public_subnet_ids
  cluster_version    = "1.28"
  node_instance_types = ["t3.medium"]
  desired_size       = 2
  min_size           = 1
  max_size           = 4
}

module "monitoring" {
  source = "../../modules/monitoring"
  environment = "dev"
  eks_cluster_name = module.eks.cluster_name
  alert_email      = "devops@flowbuilder.io"
}

module "vault" {
  source = "../../modules/vault"
  environment = "dev"
  eks_cluster_name = module.eks.cluster_name
}
