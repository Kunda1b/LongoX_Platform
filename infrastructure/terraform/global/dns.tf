resource "aws_route53_zone" "main" {
  name = var.root_domain

  tags = {
    Project = "LongoX"
    ManagedBy = "Terraform"
  }
}

resource "aws_route53_zone" "dev" {
  name = "dev.${var.root_domain}"

  tags = {
    Environment = "dev"
    Project     = "LongoX"
    ManagedBy   = "Terraform"
  }
}

resource "aws_route53_zone" "staging" {
  name = "staging.${var.root_domain}"

  tags = {
    Environment = "staging"
    Project     = "LongoX"
    ManagedBy   = "Terraform"
  }
}

resource "aws_route53_zone" "production" {
  name = "app.${var.root_domain}"

  tags = {
    Environment = "production"
    Project     = "LongoX"
    ManagedBy   = "Terraform"
  }
}

resource "aws_route53_record" "api_dev" {
  zone_id = aws_route53_zone.dev.zone_id
  name    = "api.dev.${var.root_domain}"
  type    = "A"

  alias {
    name                   = var.dev_alb_dns_name
    zone_id                = var.dev_alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "app_dev" {
  zone_id = aws_route53_zone.dev.zone_id
  name    = "app.dev.${var.root_domain}"
  type    = "A"

  alias {
    name                   = var.dev_alb_dns_name
    zone_id                = var.dev_alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "api_staging" {
  zone_id = aws_route53_zone.staging.zone_id
  name    = "api.staging.${var.root_domain}"
  type    = "A"

  alias {
    name                   = var.staging_alb_dns_name
    zone_id                = var.staging_alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "app_staging" {
  zone_id = aws_route53_zone.staging.zone_id
  name    = "app.staging.${var.root_domain}"
  type    = "A"

  alias {
    name                   = var.staging_alb_dns_name
    zone_id                = var.staging_alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "api_production" {
  zone_id = aws_route53_zone.production.zone_id
  name    = "api.${var.root_domain}"
  type    = "A"

  alias {
    name                   = var.prod_alb_dns_name
    zone_id                = var.prod_alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "app_production" {
  zone_id = aws_route53_zone.production.zone_id
  name    = "app.${var.root_domain}"
  type    = "A"

  alias {
    name                   = var.prod_alb_dns_name
    zone_id                = var.prod_alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_acm_certificate" "main" {
  domain_name       = "*.${var.root_domain}"
  subject_alternative_names = ["${var.root_domain}"]
  validation_method = "DNS"

  tags = {
    Project = "LongoX"
    ManagedBy = "Terraform"
  }
}

resource "aws_acm_certificate" "dev" {
  domain_name       = "*.dev.${var.root_domain}"
  validation_method = "DNS"

  tags = {
    Environment = "dev"
    Project     = "LongoX"
    ManagedBy   = "Terraform"
  }
}

resource "aws_acm_certificate" "staging" {
  domain_name       = "*.staging.${var.root_domain}"
  validation_method = "DNS"

  tags = {
    Environment = "staging"
    Project     = "LongoX"
    ManagedBy   = "Terraform"
  }
}

resource "aws_acm_certificate" "production" {
  domain_name       = "*.app.${var.root_domain}"
  validation_method = "DNS"

  tags = {
    Environment = "production"
    Project     = "LongoX"
    ManagedBy   = "Terraform"
  }
}

resource "aws_route53_record" "cert_validation_main" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.main.zone_id
}

resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation_main : record.fqdn]
}

variable "root_domain" {
  description = "Root domain name"
  type        = string
  default     = "longox.io"
}

variable "dev_alb_dns_name" {
  description = "Dev ALB DNS name"
  type        = string
  default     = ""
}

variable "dev_alb_zone_id" {
  description = "Dev ALB hosted zone ID"
  type        = string
  default     = ""
}

variable "staging_alb_dns_name" {
  description = "Staging ALB DNS name"
  type        = string
  default     = ""
}

variable "staging_alb_zone_id" {
  description = "Staging ALB hosted zone ID"
  type        = string
  default     = ""
}

variable "prod_alb_dns_name" {
  description = "Production ALB DNS name"
  type        = string
  default     = ""
}

variable "prod_alb_zone_id" {
  description = "Production ALB hosted zone ID"
  type        = string
  default     = ""
}
