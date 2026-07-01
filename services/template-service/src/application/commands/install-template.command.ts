import type { TemplateRepository } from "../../domain/template/template-repository";
import type { Template, TemplateInstall } from "../../domain/template/template.entity";

export interface InstallTemplateInput {
  templateId: string;
  tenantId: string;
  versionId?: string;
  config?: Record<string, unknown>;
}

export interface InstallTemplateResult {
  installId: string;
  templateId: string;
  templateName: string;
  installedArtifacts: string[];
}

interface TemplateDependency {
  templateId?: string;
  name?: string;
  version?: string;
}

export class InstallTemplateCommand {
  constructor(private repo: TemplateRepository) {}

  async execute(input: InstallTemplateInput): Promise<InstallTemplateResult> {
    const template = (await this.repo.findById(input.templateId)) as Template | null;
    if (!template) throw new Error(`Template ${input.templateId} not found`);

    const installRecord: TemplateInstall = {
      id: this.generateId(),
      templateId: input.templateId,
      tenantId: input.tenantId,
      versionId: input.versionId ?? crypto.randomUUID(),
      status: "installed",
      config: input.config ?? {},
      installedAt: new Date().toISOString(),
    };

    const installedArtifacts: string[] = [
      `${template.sourceType}:${template.name}@${input.versionId ?? "latest"}`,
    ];

    const metadata = (template as any).metadata ?? {};
    const deps: TemplateDependency[] = metadata.dependencies ?? [];

    for (const dep of deps) {
      let depTemplate: Template | null = null;
      if (dep.templateId) {
        depTemplate = (await this.repo.findById(dep.templateId)) as Template | null;
      }
      if (depTemplate) {
        installedArtifacts.push(
          `${depTemplate.sourceType}:${dep.name ?? depTemplate.name}@${dep.version ?? "latest"}`,
        );
      }
    }

    return {
      installId: installRecord.id,
      templateId: input.templateId,
      templateName: template.name,
      installedArtifacts,
    };
  }

  private generateId(): string {
    return `install-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
