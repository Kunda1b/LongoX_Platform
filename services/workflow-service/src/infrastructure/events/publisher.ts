import {
  eventBus,
  createEvent,
  type PlatformEventType,
} from "@longox/shared-events";

export class WorkflowEventPublisher {
  async publishWorkflowCreated(
    workflowId: string,
    name: string,
    triggerType: string,
  ): Promise<void> {
    await eventBus.publish(
      createEvent("workflow.created", String(workflowId), "workflow", {
        name,
        triggerType,
      }),
    );
  }

  async publishWorkflowUpdated(
    workflowId: string,
    name: string,
  ): Promise<void> {
    await eventBus.publish(
      createEvent("workflow.updated", String(workflowId), "workflow", { name }),
    );
  }

  async publishWorkflowDeleted(workflowId: string): Promise<void> {
    await eventBus.publish(
      createEvent("workflow.deleted", String(workflowId), "workflow", {}),
    );
  }

  async publishWorkflowPublished(
    workflowId: string,
    version: number,
    changeNote?: string,
  ): Promise<void> {
    await eventBus.publish(
      createEvent("workflow.published", String(workflowId), "workflow", {
        version,
        changeNote: changeNote ?? null,
      }),
    );
  }

  async publishExecutionStarted(
    executionId: string,
    workflowId: string,
    triggerType: string,
  ): Promise<void> {
    await eventBus.publish(
      createEvent("execution.started", String(executionId), "execution", {
        workflowId,
        triggerType,
      }),
    );
  }

  async publishExecutionCompleted(
    executionId: string,
    workflowId: string,
    durationMs: number,
  ): Promise<void> {
    await eventBus.publish(
      createEvent("execution.completed", String(executionId), "execution", {
        workflowId,
        durationMs,
      }),
    );
  }

  async publishExecutionFailed(
    executionId: string,
    workflowId: string,
    error: string,
  ): Promise<void> {
    await eventBus.publish(
      createEvent("execution.failed", String(executionId), "execution", {
        workflowId,
        error,
      }),
    );
  }
}
