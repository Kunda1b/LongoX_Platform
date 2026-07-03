import { evaluationGateService } from "../src/application/services/evaluation/evaluation-gate.service";

const promptId = Number(process.env.PROMPT_ID);
const datasetId = Number(process.env.DATASET_ID);
const threshold = Number(process.env.EVAL_THRESHOLD ?? "0.8");

if (!promptId || !datasetId) {
  console.error("Usage: PROMPT_ID=<id> DATASET_ID=<id> pnpm eval-gate");
  process.exit(1);
}

async function main() {
  console.log(`Running eval gate for prompt=${promptId} dataset=${datasetId} threshold=${threshold}`);

  const result = await evaluationGateService.checkPromotionGate(
    promptId,
    0,
    "production",
  );

  if (result.allowed) {
    console.log(`PASS: score=${result.score} threshold=${threshold}`);
    process.exit(0);
  } else {
    console.error(`FAIL: score=${result.score} threshold=${threshold} reason=${result.reason}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Eval gate error:", err);
  process.exit(1);
});
