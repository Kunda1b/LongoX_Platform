import type { NodeExecutor } from "@longox/workflow-engine";
import { WorkflowRunner } from "@longox/workflow-engine";
import {
  HttpExecutor,
  SlackExecutor,
  EmailExecutor,
  DbQueryExecutor,
  TriggerExecutor,
  ConditionExecutor,
  TransformExecutor,
  AiExecutor,
  ApprovalExecutor,
  CodeExecutor,
} from "./index";

export function createExecutors(): NodeExecutor[] {
  return [
    new TriggerExecutor(),
    new HttpExecutor(),
    new SlackExecutor(),
    new EmailExecutor(),
    new DbQueryExecutor(),
    new ConditionExecutor(),
    new TransformExecutor(),
    new AiExecutor(),
    new ApprovalExecutor(),
    new CodeExecutor(),
  ];
}

export function findExecutor(
  executors: NodeExecutor[],
  nodeTypeId: string,
): NodeExecutor | null {
  for (const executor of executors) {
    if (executor.canHandle(nodeTypeId)) return executor;
  }
  return null;
}

export function createWorkflowRunner(): WorkflowRunner {
  const runner = new WorkflowRunner();
  for (const executor of createExecutors()) {
    runner.registerExecutor(executor);
  }
  return runner;
}
