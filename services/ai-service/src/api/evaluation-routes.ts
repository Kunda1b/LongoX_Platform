import { Router, type IRouter } from "express";
import { authorize, requireTenantContext } from "@longox/shared-rbac";
import { evaluationDatasetService } from "../application/services/evaluation/evaluation-dataset.service";
import { evaluationRunService } from "../application/services/evaluation/evaluation-run.service";
import { regressionGateService } from "../application/services/evaluation/regression-gate.service";

const router: IRouter = Router();

router.use(requireTenantContext);

router.post("/datasets", authorize("ai:write"), async (req, res): Promise<void> => {
  try {
    const { name, description, promptId, metadata } = req.body as {
      name: string;
      description?: string;
      promptId?: string;
      metadata?: Record<string, unknown>;
    };

    if (!name?.trim()) {
      res.status(400).json({ error: "name is required" });
      return;
    }

    const dataset = await evaluationDatasetService.createDataset({
      name: name.trim(),
      description,
      tenantId: req.user!.tenantId!,
      promptId,
      metadata,
    });

    res.status(201).json(dataset);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
  }
});

router.get("/datasets", authorize("ai:read"), async (req, res): Promise<void> => {
  try {
    const datasets = await evaluationDatasetService.listDatasets(req.user!.tenantId!);
    res.json(datasets);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
  }
});

router.get("/datasets/:id", authorize("ai:read"), async (req, res): Promise<void> => {
  try {
    const dataset = await evaluationDatasetService.getDataset(String(req.params.id));
    if (!dataset) {
      res.status(404).json({ error: "Dataset not found" });
      return;
    }
    res.json(dataset);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
  }
});

router.post("/datasets/:id/entries", authorize("ai:write"), async (req, res): Promise<void> => {
  try {
    const { entries } = req.body as {
      entries: Array<{
        input: string;
        expectedOutput?: string;
        context?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
      }>;
    };

    if (!entries?.length) {
      res.status(400).json({ error: "entries array is required" });
      return;
    }

    const inserted = await evaluationDatasetService.addEntries(String(req.params.id), entries);
    res.status(201).json(inserted);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
  }
});

router.delete("/datasets/:id/entries/:entryId", authorize("ai:write"), async (req, res): Promise<void> => {
  try {
    const deleted = await evaluationDatasetService.removeEntry(
      String(req.params.id),
      String(req.params.entryId),
    );
    if (!deleted) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }
    res.json({ deleted: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
  }
});

router.delete("/datasets/:id", authorize("ai:delete"), async (req, res): Promise<void> => {
  try {
    const dataset = await evaluationDatasetService.deleteDataset(String(req.params.id));
    if (!dataset) {
      res.status(404).json({ error: "Dataset not found" });
      return;
    }
    res.json({ deleted: true, status: (dataset as any).status });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
  }
});

router.post("/runs", authorize("ai:write"), async (req, res): Promise<void> => {
  try {
    const { datasetId, promptId, promptVersion, threshold } = req.body as {
      datasetId: string;
      promptId: string;
      promptVersion?: number;
      threshold?: number;
    };

    if (!datasetId || !promptId) {
      res.status(400).json({ error: "datasetId and promptId are required" });
      return;
    }

    const run = await evaluationRunService.createRun({
      datasetId,
      promptId,
      promptVersion,
      threshold,
      tenantId: req.user!.tenantId!,
    });

    const completedRun = await evaluationRunService.executeRun(run.id);

    res.status(201).json(completedRun);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
  }
});

router.get("/runs", authorize("ai:read"), async (req, res): Promise<void> => {
  try {
    const datasetId = req.query.datasetId ? String(req.query.datasetId) : undefined;
    const runs = await evaluationRunService.listRuns(datasetId);
    res.json(runs);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
  }
});

router.get("/runs/:id", authorize("ai:read"), async (req, res): Promise<void> => {
  try {
    const run = await evaluationRunService.getRun(String(req.params.id));
    if (!run) {
      res.status(404).json({ error: "Run not found" });
      return;
    }
    res.json(run);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
  }
});

router.get("/runs/:id/results", authorize("ai:read"), async (req, res): Promise<void> => {
  try {
    const results = await evaluationRunService.getRunResults(String(req.params.id));
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
  }
});

router.post("/regression-check", authorize("ai:write"), async (req, res): Promise<void> => {
  try {
    const { promptId, promptVersion, datasetId, threshold, targetEnvironment } = req.body as {
      promptId: string;
      promptVersion: number;
      datasetId?: string;
      threshold?: number;
      targetEnvironment?: string;
    };

    if (!promptId || !promptVersion) {
      res.status(400).json({ error: "promptId and promptVersion are required" });
      return;
    }

    const result = await regressionGateService.evaluateRegression(
      promptId,
      promptVersion,
      { datasetId, threshold },
    );

    const gateResult = targetEnvironment
      ? await regressionGateService.checkPromotionGate(promptId, promptVersion, targetEnvironment)
      : undefined;

    res.json({
      regression: result,
      promotionGate: gateResult,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
  }
});

export default router;
