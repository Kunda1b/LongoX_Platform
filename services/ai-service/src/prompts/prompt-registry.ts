import { db, promptsTable, templateVersionsTable } from "@longox/db";
import { eq, and, desc } from "drizzle-orm";

export interface PromptDefinition {
  id: number;
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
  async getPrompt(id: number): Promise<PromptDefinition | null> {
    const [prompt] = await db
      .select()
      .from(promptsTable)
      .where(eq(promptsTable.id, id))
      .limit(1);
    if (!prompt) return null;

    return {
      id: prompt.id,
      name: prompt.name,
      description: prompt.description,
      systemPrompt: prompt.systemPrompt,
      userTemplate: prompt.userTemplate,
      model: prompt.model,
      provider: prompt.provider,
      maxTokens: prompt.maxTokens,
      temperature: prompt.temperature,
      variables:
        typeof prompt.variables === "string"
          ? JSON.parse(prompt.variables)
          : [],
      version: this.getVersionNumber(prompt.createdAt),
    };
  }

  async listPrompts(limit: number = 50): Promise<PromptDefinition[]> {
    const rows = await db
      .select()
      .from(promptsTable)
      .orderBy(promptsTable.id)
      .limit(limit);
    return rows.map((p) => ({
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
    const [inserted] = await db
      .insert(promptsTable)
      .values({
        name: data.name,
        description: data.description,
        systemPrompt: data.systemPrompt,
        userTemplate: data.userTemplate,
        model: data.model,
        provider: data.provider,
        maxTokens: data.maxTokens,
        temperature: data.temperature,
        variables: JSON.stringify(data.variables),
      })
      .returning();

    return { ...data, id: inserted.id, version: 1 };
  }

  async updatePrompt(
    id: number,
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

    const [updated] = await db
      .update(promptsTable)
      .set(updates)
      .where(eq(promptsTable.id, id))
      .returning();
    if (!updated) return null;

    return this.getPrompt(id);
  }

  async renderPrompt(
    promptId: number,
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
