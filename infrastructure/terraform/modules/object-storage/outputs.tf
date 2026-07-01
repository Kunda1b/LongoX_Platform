output "app_data_bucket_id" {
  value = aws_s3_bucket.app_data.id
}

output "app_data_bucket_arn" {
  value = aws_s3_bucket.app_data.arn
}

output "archives_bucket_id" {
  value = aws_s3_bucket.archives.id
}

output "archives_bucket_arn" {
  value = aws_s3_bucket.archives.arn
}

output "exports_bucket_id" {
  value = aws_s3_bucket.exports.id
}

output "exports_bucket_arn" {
  value = aws_s3_bucket.exports.arn
}

output "backups_bucket_id" {
  value = aws_s3_bucket.backups.id
}

output "backups_bucket_arn" {
  value = aws_s3_bucket.backups.arn
}

output "kms_key_arn" {
  value = aws_kms_key.s3.arn
}

output "kms_key_id" {
  value = aws_kms_key.s3.key_id
}
