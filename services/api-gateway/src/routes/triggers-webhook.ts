/**
 * Webhook trigger route — receives signed webhook payloads that start workflow
 * executions.
 *
 * Per architecture.md §17.2 and §26.7:
 *   - HMAC-SHA256 signature in `x-webhook-signature` header (hex-encoded)
 *   - Unix epoch seconds in `x-webhook-timestamp` header
 *   - Reject requests with >5-minute timestamp skew (replay protection)
 *   - Body is the raw bytes — HMAC is computed over the exact bytes received
 *
 * Per ADR-008, realtime responses go via SSE; this endpoint returns 202
 * Accepted with an execution_id that the client can subscribe to.
 *
 * The endpoint is PUBLIC (no JWT) because webhooks come from external systems.
 * Authentication is the HMAC signature itself. Kong rate-limits this route
 * per-IP (see kong.yaml route `auth-public`).
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, webhookEndpointsTable, workflowsTable } from "@longox/db";
// NOTE: `@longox/execution-service/workflow-runner` is a workspace subpath
// export. TypeScript's `moduleResolution: "bundler"` sometimes fails to
// resolve workspace `exports` subpaths; the same @ts-ignore pattern is used
// in `src/routes/dlq.ts` for the same import. Runtime resolution works
// correctly via pnpm's workspace symlinks.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — workspace subpath export; see services/execution-service/package.json
import {
  startWorkflowExecution,
  writeAudit,
} from "@longox/execution-service/workflow-runner";

const router: IRouter = Router();

/** Architecture-mandated: 5-minute timestamp skew tolerance. */
const WEBHOOK_TIMESTAMP_SKEW_SECONDS = Number(
  process.env.WEBHOOK_TIMESTAMP_SKEW_SECONDS ?? 300,
);

/**
 * Verify the HMAC-SHA256 signature of a webhook payload.
 *
 * Uses timingSafeEqual to prevent timing attacks. The signature is computed
 * over `<timestamp>.<rawBody>` to bind the timestamp to the payload (prevents
 * signature replay with a different timestamp).
 *
 * @returns true if the signature is valid, false otherwise.
 */
function verifyWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string,
  timestampHeader: string,
  secret: string,
  maxSkewSeconds: number,
): { valid: boolean; reason?: string } {
  // ─── 1. Parse and validate timestamp ──────────────────────────────────────
  const timestamp = Number.parseInt(timestampHeader, 10);
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return { valid: false, reason: "INVALID_TIMESTAMP" };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const skew = Math.abs(nowSeconds - timestamp);
  if (skew > maxSkewSeconds) {
    return { valid: false, reason: "STALE_TIMESTAMP" };
  }

  // ─── 2. Compute expected HMAC ─────────────────────────────────────────────
  // HMAC is computed over `<timestamp>.<rawBody>` to bind the timestamp to
  // the payload — this prevents an attacker from replaying the same payload
  // with a fresh timestamp.
  const signedPayload = `${timestamp}.${rawBody.toString("utf8")}`;
  const expectedHmac = createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  // ─── 3. Timing-safe comparison ────────────────────────────────────────────
  // The signature header may be hex-encoded (lowercase) — normalize before
  // comparison. Length mismatch means automatic rejection (timingSafeEqual
  // requires equal-length buffers).
  const provided = signatureHeader.toLowerCase();
  if (provided.length !== expectedHmac.length) {
    return { valid: false, reason: "SIGNATURE_LENGTH_MISMATCH" };
  }

  try {
    const expectedBuf = Buffer.from(expectedHmac, "hex");
    const providedBuf = Buffer.from(provided, "hex");
    if (expectedBuf.length !== providedBuf.length) {
      return { valid: false, reason: "SIGNATURE_FORMAT_INVALID" };
    }
    if (!timingSafeEqual(expectedBuf, providedBuf)) {
      return { valid: false, reason: "SIGNATURE_MISMATCH" };
    }
  } catch {
    return { valid: false, reason: "SIGNATURE_FORMAT_INVALID" };
  }

  return { valid: true };
}

/**
 * Capture the raw body for HMAC verification. Mount this middleware BEFORE
 * express.json() so that we have access to the exact bytes received.
 *
 * Per architecture.md §17.2, the HMAC is computed over the raw body — any
 * JSON re-serialization would invalidate the signature.
 */
function captureRawBody(req: Request, _res: Response, next: () => void): void {
  // Express 5 exposes the raw body on req.body when express.raw() runs first.
  // We expect express.raw() to have already populated req.body as a Buffer
  // for this route (mounted via app.use(express.raw(...)) with a path filter).
  // If body has already been parsed as JSON (express.json ran first), we
  // cannot verify the signature and must reject.
  if (Buffer.isBuffer(req.body)) {
    next();
    return;
  }
  if (typeof req.body === "string") {
    req.body = Buffer.from(req.body, "utf8");
    next();
    return;
  }
  // JSON already parsed — cannot recover raw bytes.
  _res.status(400).json({
    error: {
      code: "INVALID_BODY",
      message:
        "Webhook trigger requires the raw request body for HMAC verification. Ensure express.raw() is mounted before express.json() for this route.",
      correlation_id: req.correlationId ?? null,
    },
  });
}

/**
 * POST /api/v1/triggers/webhook
 *
 * Headers required:
 *   - x-webhook-signature: HMAC-SHA256(secret, "<timestamp>.<rawBody>") as hex
 *   - x-webhook-timestamp: Unix epoch seconds (must be within 5min of server time)
 *   - x-correlation-id: optional, echoed back
 *
 * Body: arbitrary JSON; the structure is connector/workflow-defined. The body
 * MUST include a `workflow_id` (number) or `workflow_slug` (string) so we know
 * which workflow to trigger.
 */
router.post(
  "/triggers/webhook",
  captureRawBody,
  async (req: Request, res: Response): Promise<void> => {
    const signature = req.headers["x-webhook-signature"] as string | undefined;
    const timestamp = req.headers["x-webhook-timestamp"] as string | undefined;

    if (!signature || !timestamp) {
      res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Missing x-webhook-signature or x-webhook-timestamp header",
          correlation_id: req.correlationId ?? null,
        },
      });
      return;
    }

    const rawBody = req.body as Buffer;
    if (!Buffer.isBuffer(rawBody)) {
      res.status(400).json({
        error: {
          code: "INVALID_BODY",
          message: "Raw body required for HMAC verification",
          correlation_id: req.correlationId ?? null,
        },
      });
      return;
    }

    // ─── Parse the payload to find the workflow_id / slug ───────────────────
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody.toString("utf8")) as Record<string, unknown>;
    } catch {
      res.status(400).json({
        error: {
          code: "INVALID_JSON",
          message: "Webhook payload must be valid JSON",
          correlation_id: req.correlationId ?? null,
        },
      });
      return;
    }

    const workflowId = payload["workflow_id"] as number | undefined;
    const workflowSlug = payload["workflow_slug"] as string | undefined;
    const endpointId = payload["endpoint_id"] as string | undefined;

    if (!workflowId && !workflowSlug) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Payload must include workflow_id (number) or workflow_slug (string)",
          correlation_id: req.correlationId ?? null,
        },
      });
      return;
    }

    // ─── Look up the webhook endpoint to fetch its secret ───────────────────
    // Endpoints are configured per-workflow in the platform UI. The endpoint
    // stores the HMAC secret in Vault (referenced by secret_ref); for dev we
    // read directly from the webhook_endpoints table.
    // Note: webhook_endpoints has no tenant_id column — tenant is reached via
    // the workflow lookup below.
    let endpoint: { id: string; secret: string } | null = null;
    if (endpointId) {
      const [row] = await db
        .select({
          id: webhookEndpointsTable.id,
          secret: webhookEndpointsTable.secret,
        })
        .from(webhookEndpointsTable)
        .where(eq(webhookEndpointsTable.id, Number(endpointId)))
        .limit(1);
      if (row) {
        endpoint = {
          id: row.id,
          secret: row.secret ?? process.env.WEBHOOK_DEFAULT_SECRET ?? "",
        };
      }
    }
    // Fall back to a global default secret for dev if no endpoint is configured.
    // In production, every workflow MUST have an explicit endpoint configured.
    if (!endpoint) {
      endpoint = {
        id: 0,
        secret:
          process.env.WEBHOOK_DEFAULT_SECRET ?? "longox-dev-webhook-secret",
      };
    }

    // ─── Verify the HMAC-SHA256 signature ───────────────────────────────────
    const verification = verifyWebhookSignature(
      rawBody,
      signature,
      timestamp,
      endpoint.secret,
      WEBHOOK_TIMESTAMP_SKEW_SECONDS,
    );
    if (!verification.valid) {
      // Audit the failed verification for security monitoring.
      // Tenant context is not yet known (we haven't resolved the workflow);
      // the audit record is logged with actor_type=webhook so security
      // monitoring can correlate it with the endpoint that was probed.
      await writeAudit(
        "webhook.signature_verification_failed",
        "webhook_endpoint",
        String(endpoint.id),
        { reason: verification.reason },
        "webhook",
      );

      res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: `Webhook signature verification failed: ${verification.reason}`,
          correlation_id: req.correlationId ?? null,
        },
      });
      return;
    }

    // ─── Resolve the workflow ───────────────────────────────────────────────
    let workflow: { id: string; tenantId: string | null; name: string } | null =
      null;
    if (workflowId) {
      const [row] = await db
        .select({
          id: workflowsTable.id,
          tenantId: workflowsTable.tenantId,
          name: workflowsTable.name,
        })
        .from(workflowsTable)
        .where(eq(workflowsTable.id, workflowId))
        .limit(1);
      workflow = row ?? null;
    } else if (workflowSlug) {
      const [row] = await db
        .select({
          id: workflowsTable.id,
          tenantId: workflowsTable.tenantId,
          name: workflowsTable.name,
        })
        .from(workflowsTable)
        .where(eq(workflowsTable.name, workflowSlug))
        .limit(1);
      workflow = row ?? null;
    }

    if (!workflow) {
      res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Workflow not found",
          correlation_id: req.correlationId ?? null,
        },
      });
      return;
    }

    // ─── Trigger the workflow execution ─────────────────────────────────────
    // startWorkflowExecution signature is:
    //   (workflowId, workflowName, nodes, triggerType, triggerPayload?)
    // We don't have the full node graph at trigger time; the execution service
    // loads it from the workflow_versions table when the worker picks up the job.
    const execution = await startWorkflowExecution(
      workflow.id,
      workflow.name,
      [], // nodes — loaded by the worker from the current published version
      "webhook",
      payload,
    );

    // Audit the successful trigger.
    await writeAudit(
      "workflow.triggered",
      "workflow",
      String(workflow.id),
      { trigger_type: "webhook", execution_id: execution.id },
      "webhook",
    );

    res.status(202).json({
      execution_id: String(execution.id),
      queued_at: new Date().toISOString(),
    });
  },
);

export default router;
