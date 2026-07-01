variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "depends_on_cluster_name" {
  description = "EKS cluster name (dependency)"
  type        = string
  default     = ""
}

variable "alert_email" {
  description = "Email for alert notifications"
  type        = string
  default     = "devops@longox.io"
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for alerts"
  type        = string
  default     = ""
}

variable "root_domain" {
  description = "Root domain for ingress"
  type        = string
  default     = "longox.io"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "cpu_alarm_threshold" {
  description = "CPU alarm threshold percentage"
  type        = number
  default     = 80
}

variable "memory_alarm_threshold" {
  description = "Memory alarm threshold percentage"
  type        = number
  default     = 80
}

variable "rds_connection_threshold" {
  description = "RDS connection alarm threshold"
  type        = number
  default     = 100
}

variable "deploy_prometheus_stack" {
  description = "Deploy kube-prometheus-stack"
  type        = bool
  default     = true
}

variable "prometheus_helm_version" {
  description = "kube-prometheus-stack Helm chart version"
  type        = string
  default     = "56.0.0"
}

variable "prometheus_retention_days" {
  description = "Prometheus retention in days"
  type        = number
  default     = 30
}

variable "prometheus_retention_size" {
  description = "Prometheus retention size in GB"
  type        = number
  default     = 50
}

variable "prometheus_memory_request" {
  description = "Prometheus memory request"
  type        = string
  default     = "2Gi"
}

variable "prometheus_storage_size" {
  description = "Prometheus storage size"
  type        = string
  default     = "50Gi"
}

variable "grafana_storage_size" {
  description = "Grafana storage size"
  type        = string
  default     = "10Gi"
}

variable "deploy_loki" {
  description = "Deploy Loki for log aggregation"
  type        = bool
  default     = true
}

variable "loki_helm_version" {
  description = "Loki Helm chart version"
  type        = string
  default     = "5.0.0"
}

variable "loki_storage_size" {
  description = "Loki storage size"
  type        = string
  default     = "50Gi"
}

variable "deploy_tempo" {
  description = "Deploy Tempo for tracing"
  type        = bool
  default     = false
}

variable "tempo_helm_version" {
  description = "Tempo Helm chart version"
  type        = string
  default     = "1.0.0"
}

variable "trace_retention_days" {
  description = "Trace retention in hours"
  type        = number
  default     = 168
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}
