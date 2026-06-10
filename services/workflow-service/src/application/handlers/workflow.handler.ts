import { Workflow } from "../../domain";
import { computeChecksum } from "../../domain/versioning/workflow-version.entity";
import type { WorkflowRepository } from "../../domain";
import type { CreateWorkflowCommand } from "../commands";
import type { UpdateWorkflowCommand } from "../commands";
import type { PublishWorkflowCommand } from "../commands";
import type { DeleteWorkflowCommand } from "../commands";
import type { ToggleWorkflowCommand } from "../commands";
import type { ListWorkflowsQuery } from "../queries";
import type { GetWorkflowQuery } from "../queries";
import { eventBus, createEvent } from "@longox/shared-events";

export class WorkflowHandler {
  constructor(private readonly workflowRepo: WorkflowRepository) {}

  async handleCreate(command: CreateWorkflowCommand): Promise<Workflow> {
    const workflow = new Workflow(
      0,
      command.name,
      command.description ?? null,
      "draft",
      command.triggerType,
      0,
      0,
      [],
      [],
      null,
      null,
      new Date(),
      new Date(),
    );

    const saved = await this.workflowRepo.create(workflow);

    await eventBus.publish(
      createEvent("workflow.created", String(saved.id), "workflow", {
        name: saved.name,
        triggerType: saved.triggerType,
      }),
    );

    return saved;
  }

  async handleUpdate(command: UpdateWorkflowCommand): Promise<Workflow> {
    const workflow = await this.workflowRepo.findById(command.id);
    if (!workflow) throw new Error("Workflow not found");

    if (command.name !== undefined) workflow.name = command.name;
    if (command.description !== undefined)
      workflow.description = command.description;
    if (command.nodes !== undefined || command.edges !== undefined) {
      workflow.updateNodes(
        command.nodes ?? workflow.nodes,
        command.edges ?? workflow.edges,
      );
    }

    const saved = await this.workflowRepo.save(workflow);

    await eventBus.publish(
      createEvent("workflow.updated", String(saved.id), "workflow", {
        name: saved.name,
      }),
    );

    return saved;
  }

  async handlePublish(
    command: PublishWorkflowCommand,
  ): Promise<{ workflow: Workflow; version: number }> {
    const workflow = await this.workflowRepo.findById(command.workflowId);
    if (!workflow) throw new Error("Workflow not found");

    workflow.activate();
    const saved = await this.workflowRepo.save(workflow);

    // Version is auto-incremented by infrastructure layer
    const version = await this.workflowRepo.getNextVersion(command.workflowId);

    await eventBus.publish(
      createEvent("workflow.published", String(saved.id), "workflow", {
        version,
        changeNote: command.changeNote ?? null,
      }),
    );

    return { workflow: saved, version };
  }

  async handleDelete(command: DeleteWorkflowCommand): Promise<void> {
    const deleted = await this.workflowRepo.delete(command.id);
    if (!deleted) throw new Error("Workflow not found");

    await eventBus.publish(
      createEvent("workflow.deleted", String(command.id), "workflow", {}),
    );
  }

  async handleToggle(command: ToggleWorkflowCommand): Promise<Workflow> {
    const workflow = await this.workflowRepo.findById(command.id);
    if (!workflow) throw new Error("Workflow not found");

    if (workflow.status === "active") {
      workflow.deactivate();
    } else {
      workflow.activate();
    }

    const saved = await this.workflowRepo.save(workflow);

    await eventBus.publish(
      createEvent(
        saved.status === "active"
          ? "workflow.activated"
          : "workflow.deactivated",
        String(saved.id),
        "workflow",
        {},
      ),
    );

    return saved;
  }

  async handleList(
    query: ListWorkflowsQuery,
  ): Promise<{ data: Workflow[]; total: number }> {
    const [data, total] = await Promise.all([
      this.workflowRepo.findAll(query),
      this.workflowRepo.count(query),
    ]);
    return { data, total };
  }

  async handleGet(query: GetWorkflowQuery): Promise<Workflow> {
    const workflow = await this.workflowRepo.findById(query.id);
    if (!workflow) throw new Error("Workflow not found");
    return workflow;
  }
}
