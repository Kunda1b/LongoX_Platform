variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "vpc_cidr_block" {
  description = "VPC CIDR block"
  type        = string
}

variable "depends_on_cluster_name" {
  description = "EKS cluster name (dependency)"
  type        = string
  default     = ""
}

variable "root_domain" {
  description = "Root domain"
  type        = string
  default     = "longox.io"
}

variable "deploy_kong" {
  description = "Deploy Kong Gateway"
  type        = bool
  default     = true
}

variable "kong_helm_version" {
  description = "Kong Helm chart version"
  type        = string
  default     = "2.40.0"
}

variable "kong_image_tag" {
  description = "Kong image tag"
  type        = string
  default     = "3.7"
}

variable "kong_database_mode" {
  description = "Kong database mode (on/postgres or off)"
  type        = string
  default     = "off"
}

variable "kong_pg_host" {
  description = "Kong PostgreSQL host"
  type        = string
  default     = ""
}

variable "kong_pg_port" {
  description = "Kong PostgreSQL port"
  type        = number
  default     = 5432
}

variable "kong_pg_user" {
  description = "Kong PostgreSQL user"
  type        = string
  default     = "kong"
}

variable "kong_pg_password" {
  description = "Kong PostgreSQL password"
  type        = string
  default     = ""
  sensitive   = true
}

variable "kong_pg_database" {
  description = "Kong PostgreSQL database"
  type        = string
  default     = "kong"
}

variable "kong_pg_connection_string" {
  description = "Kong PostgreSQL connection string (for Konga)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "kong_proxy_type" {
  description = "Kong proxy service type"
  type        = string
  default     = "LoadBalancer"
}

variable "kong_replicas" {
  description = "Kong replica count"
  type        = number
  default     = 2
}

variable "kong_cpu_request" {
  description = "Kong CPU request"
  type        = string
  default     = "500m"
}

variable "kong_memory_request" {
  description = "Kong memory request"
  type        = string
  default     = "1Gi"
}

variable "kong_cpu_limit" {
  description = "Kong CPU limit"
  type        = string
  default     = "1"
}

variable "kong_memory_limit" {
  description = "Kong memory limit"
  type        = string
  default     = "2Gi"
}

variable "kong_autoscaling_enabled" {
  description = "Enable Kong autoscaling"
  type        = bool
  default     = true
}

variable "kong_min_replicas" {
  description = "Kong minimum replicas"
  type        = number
  default     = 2
}

variable "kong_max_replicas" {
  description = "Kong maximum replicas"
  type        = number
  default     = 10
}

variable "enable_kong_ingress_controller" {
  description = "Enable Kong Ingress Controller"
  type        = bool
  default     = false
}

variable "kong_declarative_config" {
  description = "Kong declarative config (YAML)"
  type        = string
  default     = ""
}

variable "deploy_konga" {
  description = "Deploy Konga UI"
  type        = bool
  default     = false
}
