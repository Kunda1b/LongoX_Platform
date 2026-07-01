variable "environment" { type = string }
variable "eks_cluster_name" { type = string }
variable "alert_email" { type = string }
variable "retention_days" { type = number, default = 30 }

resource "helm_release" "prometheus" {
  name       = "prometheus"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  version    = "56.0.0"
  namespace  = "monitoring"
  create_namespace = true

  values = [
    <<-EOT
grafana:
  enabled: true
  adminPassword: ${random_password.grafana_admin.result}
  persistence:
    enabled: true
    size: 10Gi
  ingress:
    enabled: true
    ingressClassName: nginx
    hosts: ["grafana.${var.environment}.longox.io"]

alertmanager:
  enabled: true
  config:
    global:
      resolve_timeout: 5m
    route:
      receiver: default
      routes:
        - match:
            severity: critical
          receiver: critical
    receivers:
      - name: default
        email_configs:
          - to: ${var.alert_email}
      - name: critical
        email_configs:
          - to: ${var.alert_email}
            send_resolved: true

prometheus:
  prometheusSpec:
    retention: ${var.retention_days}d
    retentionSize: 50GB
    resources:
      requests:
        memory: 2Gi
    storageSpec:
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 50Gi
EOT
  ]

  depends_on = [var.eks_cluster_name]
}

resource "helm_release" "loki" {
  name       = "loki"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "loki"
  version    = "5.0.0"
  namespace  = "monitoring"

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
      region: us-east-1
singleBinary:
  replicas: 1
EOT
  ]

  depends_on = [var.eks_cluster_name]
}

resource "random_password" "grafana_admin" {
  length  = 24
  special = false
}
