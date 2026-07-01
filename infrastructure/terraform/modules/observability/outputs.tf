output "sns_topic_arn" {
  value = aws_sns_topic.alarms.arn
}

output "grafana_admin_password" {
  value     = random_password.grafana_admin.result
  sensitive = true
}

output "cloudwatch_log_group_app" {
  value = aws_cloudwatch_log_group.app_logs.name
}

output "cloudwatch_log_group_system" {
  value = aws_cloudwatch_log_group.system_logs.name
}
