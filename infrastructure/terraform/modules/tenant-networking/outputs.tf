output "vpc_id" {
  value = aws_vpc.tenant.id
}

output "vpc_cidr_block" {
  value = aws_vpc.tenant.cidr_block
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "public_route_table_ids" {
  value = [aws_route_table.public.id]
}

output "private_route_table_ids" {
  value = aws_route_table.private[*].id
}

output "nat_gateway_ips" {
  value = aws_eip.nat[*].public_ip
}

output "availability_zones" {
  value = data.aws_availability_zones.available.names
}
