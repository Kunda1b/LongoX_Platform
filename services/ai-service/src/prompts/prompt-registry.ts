/**
 * Prompt registry.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.aiPrompt` delegate with `as any` casts for legacy columns.
 */

import { prisma } from "@longox/db/prisma";

export interface PromptDefinition {
  id: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  userTemplate: string;
  model: string;
  provider: string;
  maxTokens: number;
  temperature: number;
  variables: string[];
  version: number;
}

export class PromptRegistry {
  async getPrompt(id: string): Promise<PromptDefinition | null> {
    const prompt = await prisma.aiPrompt.findUnique({
      where: { id } as any,
    });
    if (!prompt) return null;

    const p = prompt as any;
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      systemPrompt: p.systemPrompt,
      userTemplate: p.userTemplate,
      model: p.model,
      provider: p.provider,
      maxTokens: p.maxTokens,
      temperature: p.temperature,
      variables:
        typeof p.variables === "string"
          ? JSON.parse(p.variables)
          : [],
      version: this.getVersionNumber(p.createdAt),
    };
  }

  async listPrompts(limit: number = 50): Promise<PromptDefinition[]> {
    const rows = await prisma.aiPrompt.findMany({
      orderBy: { id: "asc" } as any,
      take: limit,
    });
    return rows.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      systemPrompt: p.systemPrompt,
      userTemplate: p.userTemplate,
      model: p.model,
      provider: p.provider,
      maxTokens: p.maxTokens,
      temperature: p.temperature,
      variables: typeof p.variables === "string" ? JSON.parse(p.variables) : [],
      version: this.getVersionNumber(p.createdAt),
    }));
  }

  async createPrompt(
    data: Omit<PromptDefinition, "id" | "version">,
  ): Promise<PromptDefinition> {
    const inserted = await prisma.aiPrompt.create({
      data: {
        name: data.name,
        description: data.description,
        systemPrompt: data.systemPrompt,
        userTemplate: data.userTemplate,
        model: data.model,
        provider: data.provider,
        maxTokens: data.maxTokens,
        temperature: data.temperature,
        variables: JSON.stringify(data.variables),
      } as any,
    });

    return { ...data, id: (inserted as any).id, version: 1 };
  }

  async updatePrompt(
    id: string,
    data: Partial<Omit<PromptDefinition, "id" | "version">>,
  ): Promise<PromptDefinition | null> {
    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.systemPrompt !== undefined)
      updates.systemPrompt = data.systemPrompt;
    if (data.userTemplate !== undefined)
      updates.userTemplate = data.userTemplate;
    if (data.model !== undefined) updates.model = data.model;
    if (data.provider !== undefined) updates.provider = data.provider;
    if (data.maxTokens !== undefined) updates.maxTokens = data.maxTokens;
    if (data.temperature !== undefined) updates.temperature = data.temperature;
    if (data.variables !== undefined)
      updates.variables = JSON.stringify(data.variables);

    const updated = await prisma.aiPrompt.update({
      where: { id } as any,
      data: updates as any,
    }).catch(() => null);
    if (!updated) return null;

    return this.getPrompt(id);
  }

  async renderPrompt(
    promptId: string,
    variables: Record<string, string>,
  ): Promise<{ systemPrompt: string; userPrompt: string }> {
    const prompt = await this.getPrompt(promptId);
    if (!prompt) throw new Error(`Prompt ${promptId} not found`);

    let systemPrompt = prompt.systemPrompt;
    let userTemplate = prompt.userTemplate;

    for (const [key, value] of Object.entries(variables)) {
      systemPrompt = systemPrompt.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, "g"),
        value,
      );
      userTemplate = userTemplate.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, "g"),
        value,
      );
    }

    return { systemPrompt, userPrompt: userTemplate };
  }

  private getVersionNumber(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }
}

export const promptRegistry = new PromptRegistry();
