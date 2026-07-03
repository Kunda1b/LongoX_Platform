locals {
  common_tags = {
    Environment = var.environment
    Project     = "LongoX"
    ManagedBy   = "Terraform"
    Owner       = "PlatformTeam"
    TenantId    = var.tenant_id
  }
  all_tags = merge(local.common_tags, var.tags)
  prefix   = "longox-${var.environment}-tenant-${var.tenant_id}"
}

resource "aws_kms_key" "eks" {
  description             = "EKS Secret Encryption Key for tenant ${var.tenant_id}"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags                    = local.all_tags
}

resource "aws_cloudwatch_log_group" "eks" {
  name              = "/aws/eks/${local.prefix}/cluster"
  retention_in_days = var.cluster_log_retention_days
  tags              = local.all_tags
}

resource "aws_eks_cluster" "tenant" {
  name     = local.prefix
  version  = var.cluster_version
  role_arn = aws_iam_role.eks_cluster.arn

  vpc_config {
    subnet_ids              = var.private_subnet_ids
    endpoint_private_access = true
    endpoint_public_access  = false
    security_group_ids      = [aws_security_group.eks_cluster.id]
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  depends_on = [
    aws_cloudwatch_log_group.eks,
    aws_iam_role_policy_attachment.eks_cluster_policy,
  ]

  tags = local.all_tags
}

resource "aws_security_group" "eks_cluster" {
  name        = "${local.prefix}-cluster-sg"
  description = "EKS cluster security group for tenant ${var.tenant_id}"
  vpc_id      = var.vpc_id
  tags        = local.all_tags
}

resource "aws_security_group_rule" "eks_cluster_https" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = [var.vpc_cidr_block]
  security_group_id = aws_security_group.eks_cluster.id
}

resource "aws_iam_role" "eks_cluster" {
  name = "${local.prefix}-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "eks.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })

  tags = local.all_tags
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role" "node_group" {
  name = "${local.prefix}-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })

  tags = local.all_tags
}

resource "aws_iam_role_policy_attachment" "node_worker_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.node_group.name
}

resource "aws_iam_role_policy_attachment" "node_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.node_group.name
}

resource "aws_iam_role_policy_attachment" "node_ecr_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.node_group.name
}

resource "aws_iam_role_policy_attachment" "node_ssm_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  role       = aws_iam_role.node_group.name
}

resource "aws_eks_node_group" "on_demand" {
  cluster_name    = aws_eks_cluster.tenant.name
  node_group_name = "${local.prefix}-on-demand"
  node_role_arn   = aws_iam_role.node_group.arn
  subnet_ids      = var.private_subnet_ids

  scaling_config {
    desired_size = var.node_desired_size
    min_size     = var.node_min_size
    max_size     = var.node_max_size
  }

  instance_types = [var.node_instance_type]

  disk_size = var.node_disk_size

  tags = local.all_tags

  depends_on = [
    aws_iam_role_policy_attachment.node_worker_policy,
    aws_iam_role_policy_attachment.node_cni_policy,
    aws_iam_role_policy_attachment.node_ecr_policy,
  ]
}

data "tls_certificate" "eks" {
  url = aws_eks_cluster.tenant.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "oidc" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.tenant.identity[0].oidc[0].issuer

  tags = local.all_tags
}
