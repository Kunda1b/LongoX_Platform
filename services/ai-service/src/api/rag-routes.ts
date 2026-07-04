/**
 * RAG routes.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.knowledgeBase`, `prisma.knowledgeDocument`, and
 * `prisma.vectorEmbedding` delegates with `as any` casts for legacy columns.
 */

import { Router, type IRouter } from "express";
import { prisma } from "@longox/db/prisma";
import { authorize, requireTenantContext } from "@longox/shared-rbac";
import {
  documentIngestionService,
  vectorSearchService,
  ragQueryService,
} from "../application/services/rag";

const router: IRouter = Router();

function fmtKB(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    embeddingModel: row.embeddingModel,
    chunkStrategy: row.chunkStrategy,
    chunkSize: row.chunkSize,
    chunkOverlap: row.chunkOverlap,
    tenantId: row.tenantId,
    status: row.status,
    documentCount: row.documentCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function fmtDoc(row: any) {
  return {
    id: row.id,
    knowledgeBaseId: row.knowledgeBaseId,
    filename: row.filename,
    sourceType: row.sourceType,
    contentType: row.contentType ?? null,
    contentHash: row.contentHash ?? null,
    pageCount: row.pageCount ?? null,
    status: row.status,
    errorMessage: row.errorMessage ?? null,
    metadata: row.metadata ?? {},
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

router.post("/api/rag/knowledge-bases", authorize("ai:write"), requireTenantContext, async (req, res): Promise<void> => {
  const { name, description, embeddingModel, chunkStrategy, chunkSize, chunkOverlap } = req.body as {
    name: string;
    description?: string;
    embeddingModel?: string;
    chunkStrategy?: string;
    chunkSize?: number;
    chunkOverlap?: number;
  };
  if (!name?.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const tenantId = (req as any).tenantId;
  if (!tenantId) {
    res.status(400).json({ error: "tenant context required" });
    return;
  }
  const row = await prisma.knowledgeBase.create({
    data: {
      name: name.trim(),
      description: description ?? null,
      embeddingModel: embeddingModel ?? "text-embedding-3-small",
      chunkStrategy: (chunkStrategy ?? "recursive") as any,
      chunkSize: chunkSize ?? 512,
      chunkOverlap: chunkOverlap ?? 64,
      tenantId,
      status: "active",
      documentCount: 0,
    } as any,
  });
  res.status(201).json(fmtKB(row));
});

router.get("/api/rag/knowledge-bases", authorize("ai:read"), requireTenantContext, async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId;
  const rows = await prisma.knowledgeBase.findMany({
    where: { tenantId } as any,
    orderBy: { id: "asc" } as any,
  });
  res.json(rows.map(fmtKB));
});

router.get("/api/rag/knowledge-bases/:id", authorize("ai:read"), requireTenantContext, async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId;
  const row = await prisma.knowledgeBase.findUnique({
    where: { id: String(req.params.id) } as any,
  });
  if (!row || (row as any).tenantId !== tenantId) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fmtKB(row));
});

router.delete("/api/rag/knowledge-bases/:id", authorize("ai:delete"), requireTenantContext, async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId;
  const kbId = String(req.params.id);
  const kb = await prisma.knowledgeBase.findUnique({
    where: { id: kbId } as any,
  });
  if (!kb || (kb as any).tenantId !== tenantId) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await prisma.vectorEmbedding.deleteMany({
    where: { knowledgeBaseId: kbId } as any,
  });
  await prisma.knowledgeDocument.deleteMany({
    where: { knowledgeBaseId: kbId } as any,
  });
  await prisma.knowledgeBase.delete({
    where: { id: kbId } as any,
  });
  res.status(204).end();
});

router.post("/api/rag/knowledge-bases/:id/documents", authorize("ai:write"), requireTenantContext, async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId;
  const kbId = String(req.params.id);
  const kb = await prisma.knowledgeBase.findUnique({
    where: { id: kbId } as any,
  });
  if (!kb || (kb as any).tenantId !== tenantId) {
    res.status(404).json({ error: "Knowledge base not found" });
    return;
  }
  const { filename, content, sourceType, contentType } = req.body as {
    filename: string;
    content: string;
    sourceType?: string;
    contentType?: string;
  };
  if (!filename?.trim() || !content?.trim()) {
    res.status(400).json({ error: "filename and content are required" });
    return;
  }
  const result = await documentIngestionService.ingestDocument(kbId, {
    filename: filename.trim(),
    content,
    sourceType: (sourceType ?? "manual") as any,
    contentType,
  });
  res.status(result.status === "error" ? 500 : 201).json(result);
});

router.get("/api/rag/knowledge-bases/:id/documents", authorize("ai:read"), requireTenantContext, async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId;
  const kbId = String(req.params.id);
  const kb = await prisma.knowledgeBase.findUnique({
    where: { id: kbId } as any,
  });
  if (!kb || (kb as any).tenantId !== tenantId) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const rows = await prisma.knowledgeDocument.findMany({
    where: { knowledgeBaseId: kbId } as any,
    orderBy: { id: "asc" } as any,
  });
  res.json(rows.map(fmtDoc));
});

router.delete("/api/rag/knowledge-bases/:id/documents/:docId", authorize("ai:write"), requireTenantContext, async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId;
  const kbId = String(req.params.id);
  const docId = String(req.params.docId);
  const kb = await prisma.knowledgeBase.findUnique({
    where: { id: kbId } as any,
  });
  if (!kb || (kb as any).tenantId !== tenantId) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await documentIngestionService.deleteDocument(docId);
  res.status(204).end();
});

router.post("/api/rag/knowledge-bases/:id/search", authorize("ai:read"), requireTenantContext, async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId;
  const kbId = String(req.params.id);
  const kb = await prisma.knowledgeBase.findUnique({
    where: { id: kbId } as any,
  });
  if (!kb || (kb as any).tenantId !== tenantId) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const { query, topK, minScore, filter, hybrid } = req.body as {
    query: string;
    topK?: number;
    minScore?: number;
    filter?: Record<string, unknown>;
    hybrid?: boolean;
  };
  if (!query?.trim()) {
    res.status(400).json({ error: "query is required" });
    return;
  }
  const results = hybrid
    ? await vectorSearchService.hybridSearch(kbId, query, { topK, minScore, filter })
    : await vectorSearchService.search(kbId, query, { topK, minScore, filter });
  res.json({ results });
});

router.post("/api/rag/knowledge-bases/:id/query", authorize("ai:write"), requireTenantContext, async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId;
  const kbId = String(req.params.id);
  const kb = await prisma.knowledgeBase.findUnique({
    where: { id: kbId } as any,
  });
  if (!kb || (kb as any).tenantId !== tenantId) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const { question, topK, minScore, filter, model, maxTokens, temperature, citationFormat, includeSources } = req.body as {
    question: string;
    topK?: number;
    minScore?: number;
    filter?: Record<string, unknown>;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    citationFormat?: string;
    includeSources?: boolean;
  };
  if (!question?.trim()) {
    res.status(400).json({ error: "question is required" });
    return;
  }
  const result = await ragQueryService.query(kbId, question, {
    topK,
    minScore,
    filter,
    model,
    maxTokens,
    temperature,
    citationFormat,
    includeSources,
  });
  res.json(result);
});

router.post("/api/rag/knowledge-bases/:id/reindex", authorize("ai:write"), requireTenantContext, async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId;
  const kbId = String(req.params.id);
  const kb = await prisma.knowledgeBase.findUnique({
    where: { id: kbId } as any,
  });
  if (!kb || (kb as any).tenantId !== tenantId) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const docs = await prisma.knowledgeDocument.findMany({
    where: { knowledgeBaseId: kbId } as any,
    select: { id: true } as any,
  });
  const results = [];
  for (const doc of docs as any[]) {
    const result = await documentIngestionService.reindexDocument(doc.id);
    results.push(result);
  }
  res.json({ reindexed: results.length, results });
});

export default router;
