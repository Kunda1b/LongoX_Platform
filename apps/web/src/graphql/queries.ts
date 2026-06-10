import { defineQuery } from "../api/client";
export const GET_CURRENT_USER = defineQuery("me", `query Me { me { id email name tenant { id name plan } roles { id name } permissions } }`);
export const GET_WORKFLOW = defineQuery("workflow", `query Workflow($id: ID!) { workflow(id: $id) { id name status version nodes edges } }`);
export const LIST_WORKFLOWS = defineQuery("workflows", `query Workflows { workflows { id name status version } }`);
export const GET_EXECUTION = defineQuery("execution", `query Execution($id: ID!) { execution(id: $id) { id status startedAt steps } }`);
export const WORKFLOW_PUBLISHED = defineQuery("workflowPublished", `subscription WorkflowPublished { workflowPublished { workflowId versionId status } }`);
