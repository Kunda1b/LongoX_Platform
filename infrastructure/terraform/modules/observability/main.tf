locals {
  common_tags = {
    Environment = var.environment
    Project     = "LongoX"
    ManagedBy   = "Terraform"
    Owner       = "PlatformTeam"
  }
}

resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/longox/${var.environment}/app"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "system_logs" {
  name              = "/longox/${var.environment}/system"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "longox-${var.environment}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.cpu_alarm_threshold
  alarm_description   = "CPU utilization is high"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "high_memory" {
  alarm_name          = "longox-${var.environment}-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.memory_alarm_threshold
  alarm_description   = "Memory utilization is high"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  alarm_name          = "longox-${var.environment}-rds-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.rds_connection_threshold
  alarm_description   = "RDS connections are high"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  tags = local.common_tags
}

resource "aws_cloudwatch_composite_alarm" "system_health" {
  alarm_name        = "longox-${var.environment}-system-health"
  alarm_rule        = "ALARM(\"${aws_cloudwatch_metric_alarm.high_cpu.alarm_name}\") OR ALARM(\"${aws_cloudwatch_metric_alarm.high_memory.alarm_name}\")"
  alarm_description = "Composite alarm for system health"

  tags = local.common_tags
}

resource "aws_sns_topic" "alarms" {
  name = "longox-${var.environment}-alarms"

  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "alarm_email" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_sns_topic_subscription" "alarm_slack" {
  count     = var.slack_webhook_url != "" ? 1 : 0
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "https"
  endpoint  = var.slack_webhook_url
}

resource "helm_release" "prometheus_stack" {
  count = var.deploy_prometheus_stack ? 1 : 0

  name             = "kube-prometheus-stack"
  repository       = "https://prometheus-community.github.io/helm-charts"
  chart            = "kube-prometheus-stack"
  version          = var.prometheus_helm_version
  namespace        = "monitoring"
  create_namespace = true
  timeout          = 600

  values = [
    <<-EOT
global:
  rbac:
    create: true

grafana:
  enabled: true
  adminPassword: ${random_password.grafana_admin.result}
  defaultDashboardsEnabled: true
  persistence:
    enabled: true
    size: ${var.grafana_storage_size}
  ingress:
    enabled: true
    ingressClassName: nginx
    hosts: ["grafana.${var.environment}.${var.root_domain}"]
  additionalDataSources:
    - name: Loki
      type: loki
      url: http://loki:3100
      access: proxy

alertmanager:
  enabled: true
  config:
    global:
      resolve_timeout: 5m
      slack_api_url: "${var.slack_webhook_url}"
    route:
      group_by: ['namespace', 'severity']
      group_wait: 30s
      group_interval: 5m
      repeat_interval: 4h
      receiver: default
      routes:
        - match:
            severity: critical
          receiver: critical
        - match:
            severity: warning
          receiver: warning
    receivers:
      - name: default
        email_configs:
          - to: ${var.alert_email}
            send_resolved: true
      - name: critical
        email_configs:
          - to: ${var.alert_email}
            send_resolved: true
        %{ if var.slack_webhook_url != "" ~}
        slack_configs:
          - channel: "#alerts-critical"
            send_resolved: true
        %{ endif ~}
      - name: warning
        email_configs:
          - to: ${var.alert_email}
            send_resolved: true

prometheus:
  prometheusSpec:
    retention: ${var.prometheus_retention_days}d
    retentionSize: ${var.prometheus_retention_size}GB
    resources:
      requests:
        memory: ${var.prometheus_memory_request}
    storageSpec:
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: ${var.prometheus_storage_size}
    ruleSelectorNilUsesHelmValues: false
    serviceMonitorSelectorNilUsesHelmValues: false
    podMonitorSelectorNilUsesHelmValues: false
EOT
  ]

  depends_on = [var.depends_on_cluster_name]
}

resource "helm_release" "loki" {
  count = var.deploy_loki ? 1 : 0

  name             = "loki"
  repository       = "https://grafana.github.io/helm-charts"
  chart            = "loki"
  version          = var.loki_helm_version
  namespace        = "monitoring"
  timeout          = 600

  values = [
    <<-EOT
loki:
  schemaConfig:
    configs:
      - from: "2024-01-01"
        store: tsdb
        object_store: s3
        schema: v13
        index:
          prefix: index_
          period: 24h
  storage_config:
    aws:
      bucketnames: longox-logs-${var.environment}
      region: ${var.aws_region}
  auth_enabled: false
singleBinary:
  replicas: ${var.environment == "production" ? 3 : 1}
  persistence:
    enabled: true
    size: ${var.loki_storage_size}
EOT
  ]

  depends_on = [var.depends_on_cluster_name]
}

resource "helm_release" "tempo" {
  count = var.deploy_tempo ? 1 : 0

  name             = "tempo"
  repository       = "https://grafana.github.io/helm-charts"
  chart            = "tempo"
  version          = var.tempo_helm_version
  namespace        = "monitoring"
  timeout          = 600

  values = [
    <<-EOT
tempo:
  search:
    enabled: true
  metrics:
    enabled: true
  storage:
    trace:
      backend: s3
      s3:
        bucket: longox-traces-${var.environment}
        region: ${var.aws_region}
  retention: ${var.trace_retention_days}h
server:
  grpc_server_max_recv_msg_size: 4194304
  http_server_read_timeout: 60s
  http_server_write_timeout: 60s
EOT
  ]

  depends_on = [var.depends_on_cluster_name]
}

resource "random_password" "grafana_admin" {
  length  = 24
  special = false
}
