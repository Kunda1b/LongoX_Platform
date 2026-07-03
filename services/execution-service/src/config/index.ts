export {
  runtimeConfig,
  validateRuntimeConfig,
  type RuntimeConfig,
} from "./runtime";

// Legacy AWS/S3 config retained for backward compatibility with archive-export
// and cold-query services. New code should prefer `runtimeConfig` for any
// runtime knobs that have architecture-mandated defaults.
export const config = {
  aws: {
    region: process.env.AWS_REGION ?? "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
  s3: {
    archiveExportBucket: process.env.ARCHIVE_EXPORT_BUCKET ?? "longox-archives",
    coldQueryBucket: process.env.COLD_QUERY_BUCKET ?? "longox-cold-storage",
    endpoint: process.env.S3_ENDPOINT ?? undefined,
  },
} as const;
