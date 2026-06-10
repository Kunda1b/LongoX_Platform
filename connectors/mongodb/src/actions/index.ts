import type { ActionContext, ActionResult } from "@autoflow/connector-runtime";

export async function findDocuments(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const connectionString = String(context.config.connectionString ?? context.auth.credentials.connectionString ?? "");
  const collection = String(context.config.collection ?? "");
  const filter = (context.config.filter ?? {}) as Record<string, unknown>;
  const limit = Number(context.config.limit ?? 100);

  if (!connectionString) return { success: false, data: {}, error: "MongoDB connection string required", durationMs: Date.now() - start };
  if (!collection) return { success: false, data: {}, error: "Collection name required", durationMs: Date.now() - start };

  try {
    const { MongoClient } = await import("mongodb");
    const client = new MongoClient(connectionString);
    await client.connect();
    const db = client.db();
    const docs = await db.collection(collection).find(filter).limit(limit).toArray();
    await client.close();

    return {
      success: true,
      data: { documents: docs.map((d: Record<string, unknown>) => ({ ...d, _id: String(d._id) })), count: docs.length },
      error: null,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return { success: false, data: {}, error: err instanceof Error ? err.message : String(err), durationMs: Date.now() - start };
  }
}

export async function insertDocument(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const connectionString = String(context.config.connectionString ?? context.auth.credentials.connectionString ?? "");
  const collection = String(context.config.collection ?? "");
  const document = (context.config.document ?? {}) as Record<string, unknown>;

  try {
    const { MongoClient } = await import("mongodb");
    const client = new MongoClient(connectionString);
    await client.connect();
    const db = client.db();
    const result = await db.collection(collection).insertOne(document);
    await client.close();

    return { success: true, data: { id: String(result.insertedId) }, error: null, durationMs: Date.now() - start };
  } catch (err) {
    return { success: false, data: {}, error: err instanceof Error ? err.message : String(err), durationMs: Date.now() - start };
  }
}

export async function updateDocument(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const connectionString = String(context.config.connectionString ?? context.auth.credentials.connectionString ?? "");
  const collection = String(context.config.collection ?? "");
  const filter = (context.config.filter ?? {}) as Record<string, unknown>;
  const update = (context.config.update ?? {}) as Record<string, unknown>;

  try {
    const { MongoClient } = await import("mongodb");
    const client = new MongoClient(connectionString);
    await client.connect();
    const db = client.db();
    const result = await db.collection(collection).updateMany(filter, { $set: update });
    await client.close();

    return { success: true, data: { modifiedCount: result.modifiedCount }, error: null, durationMs: Date.now() - start };
  } catch (err) {
    return { success: false, data: {}, error: err instanceof Error ? err.message : String(err), durationMs: Date.now() - start };
  }
}

export async function deleteDocument(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const connectionString = String(context.config.connectionString ?? context.auth.credentials.connectionString ?? "");
  const collection = String(context.config.collection ?? "");
  const filter = (context.config.filter ?? {}) as Record<string, unknown>;

  try {
    const { MongoClient } = await import("mongodb");
    const client = new MongoClient(connectionString);
    await client.connect();
    const db = client.db();
    const result = await db.collection(collection).deleteMany(filter);
    await client.close();

    return { success: true, data: { deletedCount: result.deletedCount }, error: null, durationMs: Date.now() - start };
  } catch (err) {
    return { success: false, data: {}, error: err instanceof Error ? err.message : String(err), durationMs: Date.now() - start };
  }
}
