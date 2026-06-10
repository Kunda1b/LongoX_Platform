import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, credentialsTable } from "@longox/db";
import { CreateCredentialBody, DeleteCredentialParams } from "@longox/api-zod";

const router: IRouter = Router();

function serializeCredential(c: typeof credentialsTable.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    connectorId: c.connectorId,
    connectorName: c.connectorName,
    fields: c.fields,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/credentials", async (_req, res): Promise<void> => {
  const credentials = await db
    .select()
    .from(credentialsTable)
    .orderBy(credentialsTable.createdAt);

  res.json(credentials.map(serializeCredential));
});

router.post("/credentials", async (req, res): Promise<void> => {
  const parsed = CreateCredentialBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [credential] = await db
    .insert(credentialsTable)
    .values({
      name: parsed.data.name,
      connectorId: parsed.data.connectorId,
      connectorName: parsed.data.connectorName,
      fields: parsed.data.fields,
    })
    .returning();

  res.status(201).json(serializeCredential(credential));
});

router.delete("/credentials/:id", async (req, res): Promise<void> => {
  const params = DeleteCredentialParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [credential] = await db
    .delete(credentialsTable)
    .where(eq(credentialsTable.id, params.data.id))
    .returning();

  if (!credential) {
    res.status(404).json({ error: "Credential not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
