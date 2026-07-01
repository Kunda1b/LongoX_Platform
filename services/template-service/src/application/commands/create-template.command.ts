import type { TemplateRepository } from "../../domain/template/template-repository";
import type { Template } from "../../domain/template/template.entity";

export interface CreateTemplateInput {
  name: string;
  description: string;
  category: string;
  sourceType: "workflow" | "dashboard" | "solution-pack" | "connector-bundle";
  tags: string[];
  manifestJson?: Record<string, unknown>;
}

export class CreateTemplateCommand {
  constructor(private repo: TemplateRepository) {}

  async execute(input: CreateTemplateInput): Promise<string> {
    const now = new Date().toISOString();
    const template: Template = {
      id: crypto.randomUUID(),
      name: input.name,
      slug: input.name.toLowerCase().replace(/\s+/g, "-"),
      category: input.category,
      description: input.description,
      visibility: "private",
      sourceType: input.sourceType,
      status: "draft",
      installCount: 0,
      tags: input.tags,
      createdAt: now,
      updatedAt: now,
    };
    await this.repo.save(template);
    return template.id;
  }
}
