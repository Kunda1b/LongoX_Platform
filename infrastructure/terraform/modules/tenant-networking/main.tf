locals {
  common_tags = {
    Environment = var.environment
    Project     = "LongoX"
    ManagedBy   = "Terraform"
    Owner       = "PlatformTeam"
    TenantId    = var.tenant_id
  }
  all_tags = merge(local.common_tags, var.tags)
  prefix   = "longox-${var.environment}-tenant-${var.tenant_id}"
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "tenant" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.all_tags, { Name = local.prefix })
}

resource "aws_internet_gateway" "tenant" {
  vpc_id = aws_vpc.tenant.id

  tags = merge(local.all_tags, { Name = "${local.prefix}-igw" })
}

resource "aws_subnet" "public" {
  count             = length(var.public_subnet_cidrs)
  vpc_id            = aws_vpc.tenant.id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.all_tags, { Name = "${local.prefix}-public-${count.index}" })
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.tenant.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.all_tags, { Name = "${local.prefix}-private-${count.index}" })
}

resource "aws_eip" "nat" {
  count  = var.single_nat_gateway ? 1 : length(var.public_subnet_cidrs)
  domain = "vpc"

  tags = merge(local.all_tags, { Name = "${local.prefix}-nat-${count.index}" })
}

resource "aws_nat_gateway" "main" {
  count         = var.single_nat_gateway ? 1 : length(var.public_subnet_cidrs)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.all_tags, { Name = "${local.prefix}-nat-${count.index}" })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.tenant.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.tenant.id
  }

  tags = merge(local.all_tags, { Name = "${local.prefix}-public-rt" })
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  count  = length(var.private_subnet_cidrs)
  vpc_id = aws_vpc.tenant.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = var.single_nat_gateway ? aws_nat_gateway.main[0].id : aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.all_tags, { Name = "${local.prefix}-private-rt-${count.index}" })
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_vpc_flow_log" "main" {
  count = var.enable_flow_logs ? 1 : 0

  iam_role_arn    = aws_iam_role.flow_logs[0].arn
  log_destination = aws_cloudwatch_log_group.flow_logs[0].arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.tenant.id
}

resource "aws_cloudwatch_log_group" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  name              = "${local.prefix}-flow-logs"
  retention_in_days = 30
  tags              = local.all_tags
}

data "aws_iam_policy_document" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["vpc-flow-logs.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  name               = "${local.prefix}-flow-logs-role"
  assume_role_policy = data.aws_iam_policy_document.flow_logs[0].json
  tags               = local.all_tags
}

resource "aws_iam_role_policy_attachment" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  role       = aws_iam_role.flow_logs[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}
