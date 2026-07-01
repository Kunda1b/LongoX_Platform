locals {
  common_tags = {
    Environment = var.environment
    Project     = "LongoX"
    ManagedBy   = "Terraform"
    Owner       = "PlatformTeam"
  }
}

resource "aws_security_group" "kong" {
  name        = "longox-kong-${var.environment}"
  description = "Kong Gateway security group"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidrblocks  = ["0.0.0.0/0"]
    description = "Kong proxy"
  }

  ingress {
    from_port   = 8443
    to_port     = 8443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Kong proxy SSL"
  }

  ingress {
    from_port   = 8001
    to_port     = 8001
    protocol    = "tcp"
    cidr_blocks = var.environment == "production" ? [] : [var.vpc_cidr_block]
    description = "Kong Admin API"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.common_tags
}

resource "helm_release" "kong" {
  count = var.deploy_kong ? 1 : 0

  name             = "kong"
  repository       = "https://charts.konghq.com"
  chart            = "kong"
  version          = var.kong_helm_version
  namespace        = "kong"
  create_namespace = true
  timeout          = 600

  values = [
    <<-EOT
image:
  repository: kong
  tag: ${var.kong_image_tag}

env:
  database: ${var.kong_database_mode}
  ${var.kong_database_mode == "postgres" ? "pg_host: ${var.kong_pg_host}\n  pg_port: ${var.kong_pg_port}\n  pg_user: ${var.kong_pg_user}\n  pg_password: ${var.kong_pg_password}\n  pg_database: ${var.kong_pg_database}" : "declarative_config: /etc/kong/kong.yaml"}

admin:
  enabled: true
  type: ClusterIP
  http:
    enabled: true
    servicePort: 8001

proxy:
  enabled: true
  type: ${var.kong_proxy_type}
  http:
    enabled: true
    servicePort: 8000
    containerPort: 8000
  tls:
    enabled: true
    servicePort: 8443
    containerPort: 8443
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    ${var.environment == "production" ? "service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: \"true\"" : ""}

ingressController:
  enabled: ${var.enable_kong_ingress_controller}
  installCRDs: false

enterprise:
  enabled: false

metrics:
  enabled: true
  serviceMonitor:
    enabled: true
    namespace: monitoring

plugins:
  configMaps:
    - name: kong-plugin-jwt-keycloak
      pluginName: jwt-keycloak

replicaCount: ${var.kong_replicas}

resources:
  requests:
    cpu: ${var.kong_cpu_request}
    memory: ${var.kong_memory_request}
  limits:
    cpu: ${var.kong_cpu_limit}
    memory: ${var.kong_memory_limit}

autoscaling:
  enabled: ${var.kong_autoscaling_enabled}
  minReplicas: ${var.kong_min_replicas}
  maxReplicas: ${var.kong_max_replicas}
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
EOT
  ]

  depends_on = [var.depends_on_cluster_name]
}

resource "kubernetes_config_map" "kong_declarative" {
  count = var.deploy_kong && var.kong_database_mode == "off" ? 1 : 0

  metadata {
    name      = "kong-declarative-config"
    namespace = "kong"
    labels = {
      "app.kubernetes.io/part-of" = "longox"
    }
  }

  data = {
    "kong.yaml" = var.kong_declarative_config
  }

  depends_on = [var.depends_on_cluster_name]
}

resource "helm_release" "konga" {
  count = var.deploy_konga ? 1 : 0

  name             = "konga"
  repository       = "https://charts.bitnami.com/bitnami"
  chart            = "konga"
  namespace        = "kong"
  timeout          = 300

  values = [
    <<-EOT
replicaCount: 1

service:
  type: ClusterIP
  port: 1337

ingress:
  enabled: true
  ingressClassName: nginx
  hostname: konga.${var.environment}.${var.root_domain}
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod

mongodb:
  enabled: false

env:
  - name: NODE_ENV
    value: production
  - name: KONGA_HOOK_TIMEOUT
    value: "120000"
  - name: DB_ADAPTER
    value: "postgres"
  - name: DB_URI
    value: "${var.kong_pg_connection_string}"
EOT
  ]

  depends_on = [var.depends_on_cluster_name]
}
