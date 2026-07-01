output "cluster_name" {
  value = aws_eks_cluster.main.name
}

output "cluster_endpoint" {
  value = aws_eks_cluster.main.endpoint
}

output "cluster_certificate_authority_data" {
  value = aws_eks_cluster.main.certificate_authority[0].data
}

output "cluster_arn" {
  value = aws_eks_cluster.main.arn
}

output "cluster_security_group_id" {
  value = aws_eks_cluster.main.vpc_config[0].cluster_security_group_id
}

output "oidc_provider_arn" {
  value = aws_iam_openid_connect_provider.main.arn
}

output "oidc_provider_url" {
  value = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

output "node_role_arn" {
  value = aws_iam_role.eks_nodes.arn
}

output "cluster_autoscaler_policy_arn" {
  value = aws_iam_policy.cluster_autoscaler.arn
}

output "kms_key_arn" {
  value = aws_kms_key.eks.arn
}
