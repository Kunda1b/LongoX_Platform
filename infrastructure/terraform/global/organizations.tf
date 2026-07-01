data "aws_organizations_organization" "current" {}

resource "aws_organizations_organizational_unit" "workloads" {
  name      = "Workloads"
  parent_id = data.aws_organizations_organization.current.roots[0].id
}

resource "aws_organizations_organizational_unit" "security" {
  name      = "Security"
  parent_id = data.aws_organizations_organization.current.roots[0].id
}

resource "aws_organizations_organizational_unit" "infrastructure" {
  name      = "Infrastructure"
  parent_id = data.aws_organizations_organization.current.roots[0].id
}

resource "aws_organizations_account" "dev" {
  name  = "LongoX Dev"
  email = "aws-dev+longox@longox.io"
  parent_id = aws_organizations_organizational_unit.workloads.id

  tags = {
    Environment = "dev"
    Project     = "LongoX"
  }
}

resource "aws_organizations_account" "staging" {
  name  = "LongoX Staging"
  email = "aws-staging+longox@longox.io"
  parent_id = aws_organizations_organizational_unit.workloads.id

  tags = {
    Environment = "staging"
    Project     = "LongoX"
  }
}

resource "aws_organizations_account" "production" {
  name  = "LongoX Production"
  email = "aws-prod+longox@longox.io"
  parent_id = aws_organizations_organizational_unit.workloads.id

  tags = {
    Environment = "production"
    Project     = "LongoX"
  }
}

resource "aws_organizations_account" "security" {
  name  = "LongoX Security"
  email = "aws-security+longox@longox.io"
  parent_id = aws_organizations_organizational_unit.security.id

  tags = {
    Environment = "security"
    Project     = "LongoX"
  }
}

resource "aws_organizations_policy" "deny_leaving_org" {
  name = "DenyLeavingOrganization"
  type = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Deny"
      Action = [
        "aws-portal:ModifyAccount",
        "organizations:LeaveOrganization"
      ]
      Resource = "*"
    }]
  })
}

resource "aws_organizations_policy" "deny_unencrypted_volumes" {
  name = "DenyUnencryptedVolumes"
  type = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Deny"
      Action = [
        "ec2:CreateVolume"
      ]
      Resource = "*"
      Condition = {
        Bool = {
          "ec2:Encrypted" = "false"
        }
      }
    }]
  })
}

resource "aws_organizations_policy" "deny_public_s3" {
  name = "DenyPublicS3Buckets"
  type = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Deny"
      Action = [
        "s3:PutBucketAcl",
        "s3:PutBucketPolicy",
        "s3:PutObjectAcl"
      ]
      Resource = "*"
      Condition = {
        StringEquals = {
          "s3:x-amz-acl" = ["public-read", "public-read-write", "authenticated-read"]
        }
      }
    }]
  })
}

resource "aws_organizations_policy_attachment" "deny_leaving" {
  policy_id = aws_organizations_policy.deny_leaving_org.id
  target_id = aws_organizations_organizational_unit.workloads.id
}

resource "aws_organizations_policy_attachment" "deny_unencrypted" {
  policy_id = aws_organizations_policy.deny_unencrypted_volumes.id
  target_id = aws_organizations_organizational_unit.workloads.id
}

resource "aws_organizations_policy_attachment" "deny_public_s3" {
  policy_id = aws_organizations_policy.deny_public_s3.id
  target_id = aws_organizations_organizational_unit.workloads.id
}
