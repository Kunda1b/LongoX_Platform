output "db_instance_id" {
  value = aws_db_instance.tenant.id
}

output "db_endpoint" {
  value = aws_db_instance.tenant.address
}

output "db_port" {
  value = aws_db_instance.tenant.port
}

output "db_name" {
  value = aws_db_instance.tenant.db_name
}

output "db_username" {
  value = aws_db_instance.tenant.username
}

output "secret_arn" {
  value = aws_secretsmanager_secret.rds.arn
}

output "security_group_id" {
  value = aws_security_group.rds.id
}
