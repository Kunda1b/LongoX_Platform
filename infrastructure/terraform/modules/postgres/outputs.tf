output "cluster_identifier" {
  value = aws_rds_cluster.main.cluster_identifier
}

output "endpoint" {
  value = aws_rds_cluster.main.endpoint
}

output "reader_endpoint" {
  value = aws_rds_cluster.main.reader_endpoint
}

output "port" {
  value = 5432
}

output "database_name" {
  value = var.database_name
}

output "master_username" {
  value = var.master_username
}

output "security_group_id" {
  value = aws_security_group.rds.id
}

output "secret_arn" {
  value = aws_secretsmanager_secret.database.arn
}
