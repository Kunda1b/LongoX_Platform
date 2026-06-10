export interface Template {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  visibility: "public" | "private" | "tenant";
  sourceType: "workflow" | "dashboard" | "solution-pack" | "connector-bundle";
  status: "draft" | "published" | "deprecated";
  currentVersionId?: string;
  installCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
export interface TemplateVersion {
  id: string;
  templateId: string;
  semver: string;
  manifestJson: Record<string, unknown>;
  artifactRef?: string;
  checksum?: string;
  publishedAt: string;
  createdBy?: string;
}
export interface CompatibilityCheck {
  platformVersion: string;
  minPlatformVersion: string;
  maxPlatformVersion?: string;
  requiredPackages: string[];
  conflicts: string[];
}
export interface TemplateInstall {
  id: string;
  templateId: string;
  tenantId: string;
  versionId: string;
  status: "installed" | "configuring" | "active" | "retired";
  config: Record<string, unknown>;
  installedAt: string;
}
