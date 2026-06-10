import { logger } from "@longox/shared-logger";

export type StorageProvider = "s3" | "minio" | "local" | "gcs" | "azure";

export interface StorageConfig {
  provider: StorageProvider;
  region?: string;
  endpoint?: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  forcePathStyle?: boolean;
  basePath?: string;
}

export interface StorageObject {
  key: string;
  body: ReadableStream | Buffer | string;
  contentType?: string;
  contentLength?: number;
  metadata?: Record<string, string>;
}

export interface ObjectMetadata {
  key: string;
  contentType: string;
  contentLength: number;
  lastModified: string;
  etag?: string;
  metadata: Record<string, string>;
}

export class StorageClient {
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = {
      forcePathStyle: true,
      basePath: "",
      ...config,
    };
  }

  private getFullKey(key: string): string {
    return this.config.basePath
      ? `${this.config.basePath}/${key}`.replace(/\/+/g, "/")
      : key;
  }

  async upload(object: StorageObject): Promise<boolean> {
    const fullKey = this.getFullKey(object.key);

    if (this.config.provider === "local") {
      return this.uploadLocal(fullKey, object);
    }

    return this.uploadS3(fullKey, object);
  }

  async download(
    key: string,
  ): Promise<{ body: ReadableStream | null; metadata: ObjectMetadata } | null> {
    const fullKey = this.getFullKey(key);

    if (this.config.provider === "local") {
      return this.downloadLocal(fullKey);
    }

    return this.downloadS3(fullKey);
  }

  async delete(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);

    if (this.config.provider === "local") {
      return this.deleteLocal(fullKey);
    }

    return this.deleteS3(fullKey);
  }

  async list(prefix: string = ""): Promise<string[]> {
    const fullPrefix = this.getFullKey(prefix);

    if (this.config.provider === "local") {
      return this.listLocal(fullPrefix);
    }

    return this.listS3(fullPrefix);
  }

  async exists(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);

    if (this.config.provider === "local") {
      const { access } = await import("node:fs/promises");
      const { join } = await import("node:path");
      try {
        await access(join(this.config.bucket, fullKey));
        return true;
      } catch {
        return false;
      }
    }

    return this.existsS3(fullKey);
  }

  getPublicUrl(key: string): string {
    const fullKey = this.getFullKey(key);

    if (this.config.provider === "s3" || this.config.provider === "minio") {
      if (this.config.endpoint) {
        return `${this.config.endpoint}/${this.config.bucket}/${fullKey}`;
      }
      return `https://${this.config.bucket}.s3.${this.config.region ?? "us-east-1"}.amazonaws.com/${fullKey}`;
    }

    if (this.config.provider === "local") {
      return `/storage/${fullKey}`;
    }

    return `/storage/${fullKey}`;
  }

  private async uploadLocal(
    fullKey: string,
    object: StorageObject,
  ): Promise<boolean> {
    try {
      const { mkdir, writeFile } = await import("node:fs/promises");
      const { dirname, join } = await import("node:path");

      const filePath = join(this.config.bucket, fullKey);
      await mkdir(dirname(filePath), { recursive: true });

      const content =
        typeof object.body === "string" ? object.body : object.body.toString();
      await writeFile(filePath, content);

      return true;
    } catch (err) {
      logger.error({ err, key: fullKey }, "[Storage] Local upload failed");
      return false;
    }
  }

  private async downloadLocal(
    fullKey: string,
  ): Promise<{ body: ReadableStream | null; metadata: ObjectMetadata } | null> {
    try {
      const { readFile, stat } = await import("node:fs/promises");
      const { join } = await import("node:path");

      const filePath = join(this.config.bucket, fullKey);
      const stats = await stat(filePath);
      const content = await readFile(filePath);

      return {
        body: null,
        metadata: {
          key: fullKey,
          contentType: "application/octet-stream",
          contentLength: stats.size,
          lastModified: stats.mtime.toISOString(),
          metadata: {},
        },
      };
    } catch {
      return null;
    }
  }

  private async deleteLocal(fullKey: string): Promise<boolean> {
    try {
      const { unlink } = await import("node:fs/promises");
      const { join } = await import("node:path");
      await unlink(join(this.config.bucket, fullKey));
      return true;
    } catch {
      return false;
    }
  }

  private async listLocal(fullPrefix: string): Promise<string[]> {
    try {
      const { readdir, stat } = await import("node:fs/promises");
      const { join } = await import("node:path");

      const dir = join(this.config.bucket, fullPrefix);
      const entries = await readdir(dir, { recursive: true });

      const files: string[] = [];
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stats = await stat(fullPath);
        if (stats.isFile()) {
          files.push(entry);
        }
      }
      return files;
    } catch {
      return [];
    }
  }

  private async uploadS3(
    fullKey: string,
    object: StorageObject,
  ): Promise<boolean> {
    try {
      const body =
        typeof object.body === "string" ? object.body : object.body.toString();
      const url = this.buildS3Url(fullKey);

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": object.contentType ?? "application/octet-stream",
          ...(object.metadata
            ? Object.fromEntries(
                Object.entries(object.metadata).map(([k, v]) => [
                  `x-amz-meta-${k}`,
                  v,
                ]),
              )
            : {}),
        },
        body,
      });

      return res.ok;
    } catch (err) {
      logger.error({ err, key: fullKey }, "[Storage] S3 upload failed");
      return false;
    }
  }

  private async downloadS3(
    fullKey: string,
  ): Promise<{ body: ReadableStream | null; metadata: ObjectMetadata } | null> {
    try {
      const url = this.buildS3Url(fullKey);
      const res = await fetch(url);

      if (!res.ok) return null;

      const metadata: ObjectMetadata = {
        key: fullKey,
        contentType:
          res.headers.get("content-type") ?? "application/octet-stream",
        contentLength: parseInt(res.headers.get("content-length") ?? "0"),
        lastModified:
          res.headers.get("last-modified") ?? new Date().toISOString(),
        etag: res.headers.get("etag") ?? undefined,
        metadata: {},
      };

      return { body: res.body, metadata };
    } catch (err) {
      logger.error({ err, key: fullKey }, "[Storage] S3 download failed");
      return null;
    }
  }

  private async deleteS3(fullKey: string): Promise<boolean> {
    try {
      const url = this.buildS3Url(fullKey);
      const res = await fetch(url, { method: "DELETE" });
      return res.ok;
    } catch {
      return false;
    }
  }

  private async listS3(fullPrefix: string): Promise<string[]> {
    try {
      const baseUrl = this.config.endpoint
        ? `${this.config.endpoint}/${this.config.bucket}`
        : `https://${this.config.bucket}.s3.${this.config.region ?? "us-east-1"}.amazonaws.com`;

      const url = `${baseUrl}?prefix=${encodeURIComponent(fullPrefix)}&list-type=2`;
      const res = await fetch(url);
      if (!res.ok) return [];

      const text = await res.text();
      const keys: string[] = [];
      const regex = /<Key>([^<]+)<\/Key>/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        keys.push(match[1]);
      }
      return keys;
    } catch {
      return [];
    }
  }

  private async existsS3(fullKey: string): Promise<boolean> {
    try {
      const url = this.buildS3Url(fullKey);
      const res = await fetch(url, { method: "HEAD" });
      return res.ok;
    } catch {
      return false;
    }
  }

  private buildS3Url(key: string): string {
    if (this.config.endpoint) {
      return `${this.config.endpoint}/${this.config.bucket}/${encodeURIComponent(key)}`;
    }
    return `https://${this.config.bucket}.s3.${this.config.region ?? "us-east-1"}.amazonaws.com/${encodeURIComponent(key)}`;
  }
}

let defaultClient: StorageClient | null = null;

export function getStorageClient(config?: StorageConfig): StorageClient {
  if (!defaultClient && config) {
    defaultClient = new StorageClient(config);
  }
  if (!defaultClient) {
    defaultClient = new StorageClient({
      provider: (process.env["STORAGE_PROVIDER"] as StorageProvider) ?? "local",
      region: process.env["STORAGE_REGION"],
      endpoint: process.env["STORAGE_ENDPOINT"],
      bucket: process.env["STORAGE_BUCKET"] ?? "./data/storage",
      accessKeyId: process.env["STORAGE_ACCESS_KEY"],
      secretAccessKey: process.env["STORAGE_SECRET_KEY"],
      forcePathStyle: process.env["STORAGE_FORCE_PATH_STYLE"] === "true",
      basePath: process.env["STORAGE_BASE_PATH"],
    });
  }
  return defaultClient;
}
