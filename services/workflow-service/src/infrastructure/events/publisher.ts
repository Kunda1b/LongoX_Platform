import { eventBus, createEvent, type PlatformEventType } from "@autoflow/shared-events";

export class WorkflowEventPublisher {
  async publishWorkflowCreated(workflowId: number, name: string, triggerType: string): Promise<void> {
    await eventBus.publish(createEvent(
      "workflow.created",
      String(workflowId),
      "workflow",
      { name, triggerType },
    ));
  }

  async publishWorkflowUpdated(workflowId: number, name: string): Promise<void> {
    await eventBus.publish(createEvent(
      "workflow.updated",
      String(workflowId),
      "workflow",
      { name },
    ));
  }

  async publishWorkflowDeleted(workflowId: number): Promise<void> {
    await eventBus.publish(createEvent(
      "workflow.deleted",
      String(workflowId),
      "workflow",
      {},
    ));
  }

  async publishWorkflowPublished(workflowId: number, version: number, changeNote?: string): Promise<void> {
    await eventBus.publish(createEvent(
      "workflow.published",
      String(workflowId),
      "workflow",
      { version, changeNote: changeNote ?? null },
    ));
  }

  async publishExecutionStarted(executionId: number, workflowId: number, triggerType: string): Promise<void> {
    await eventBus.publish(createEvent(
      "execution.started",
      String(executionId),
      "execution",
      { workflowId, triggerType },
    ));
  }

  async publishExecutionCompleted(executionId: number, workflowId: number, durationMs: number): Promise<void> {
    await eventBus.publish(createEvent(
      "execution.completed",
      String(executionId),
      "execution",
      { workflowId, durationMs },
    ));
  }

  async publishExecutionFailed(executionId: number, workflowId: number, error: string): Promise<void> {
    await eventBus.publish(createEvent(
      "execution.failed",
      String(executionId),
      "execution",
      { workflowId, error },
    ));
  }
}
