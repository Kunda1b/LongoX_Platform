output "cluster_name" {
  value = aws_eks_cluster.tenant.name
}

output "cluster_endpoint" {
  value = aws_eks_cluster.tenant.endpoint
}

output "cluster_certificate_authority_data" {
  value = aws_eks_cluster.tenant.certificate_authority[0].data
}

output "cluster_arn" {
  value = aws_eks_cluster.tenant.arn
}

output "cluster_security_group_id" {
  value = aws_eks_cluster.tenant.vpc_config[0].cluster_security_group_id
}

output "oidc_provider_arn" {
  value = aws_iam_openid_connect_provider.oidc.arn
}

output "oidc_provider_url" {
  value = aws_eks_cluster.tenant.identity[0].oidc[0].issuer
}

output "node_role_arn" {
  value = aws_iam_role.node_group.arn
}

output "kms_key_arn" {
  value = aws_kms_key.eks.arn
}
