import type { TemplateRepository } from "../../domain/template/template-repository";

export interface PublishTemplateInput {
  templateId: string;
  visibility: "public" | "private" | "tenant";
  marketplaceListing?: {
    title: string;
    description: string;
    category: string;
    tags: string[];
  };
}

export class PublishTemplateCommand {
  constructor(private repo: TemplateRepository) {}

  async execute(input: PublishTemplateInput): Promise<void> {
    const template = await this.repo.findById(input.templateId);
    if (!template) throw new Error(`Template ${input.templateId} not found`);

    if (input.marketplaceListing) {
      await fetch("/api/marketplace/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: input.marketplaceListing.title,
          description: input.marketplaceListing.description,
          category: input.marketplaceListing.category,
          tags: input.marketplaceListing.tags,
          resourceId: input.templateId,
        }),
      });
    }
  }
}
