const API = import.meta.env["VITE_API_URL"] ?? "/api";

export class GraphqlError extends Error {
  constructor(
    message: string,
    public errors: Array<{ message: string; locations?: unknown[]; path?: string[] }>,
  ) {
    super(message);
    this.name = "GraphqlError";
  }
}

function getAuthToken(): string | null {
  try {
    const raw = localStorage.getItem("auth");
    if (!raw) return null;
    return JSON.parse(raw).token ?? null;
  } catch {
    return null;
  }
}

interface GraphqlOptions {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}

export async function graphqlRequest<T = unknown>(options: GraphqlOptions): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API}/graphql`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: options.query,
      variables: options.variables,
      operationName: options.operationName,
    }),
  });

  const data = await res.json();

  if (data.errors && data.errors.length > 0) {
    throw new GraphqlError(
      data.errors[0].message,
      data.errors,
    );
  }

  return data.data as T;
}

export function useGraphqlQuery<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
  enabled = true,
) {
  let data: T | null = null;
  let error: Error | null = null;
  let loading = true;

  const execute = async () => {
    if (!enabled) {
      loading = false;
      return;
    }
    try {
      data = await graphqlRequest<T>({ query, variables });
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
    } finally {
      loading = false;
    }
  };

  execute();

  return { data, error, loading, refetch: execute };
}

export const fragments = {
  workflowFields: `
    fragment WorkflowFields on Workflow {
      id
      name
      status
      description
      lastRunStatus
      lastRunAt
      executionCount
      createdAt
    }
  `,
  executionFields: `
    fragment ExecutionFields on Execution {
      id
      workflowId
      workflowName
      status
      startedAt
      finishedAt
      durationMs
      errorMessage
    }
  `,
};

export const queries = {
  me: `
    query Me {
      me {
        id
        email
        name
        role
        tenantId
        permissions
      }
    }
  `,
  workflow: `
    query Workflow($id: ID!) {
      workflow(id: $id) {
        ...WorkflowFields
        nodes { id name type nodeTypeId position { x y } config }
        edges { id source target label }
        versions { id versionNumber status createdAt isActive }
      }
    }
    ${fragments.workflowFields}
  `,
  workflows: `
    query Workflows {
      workflows {
        ...WorkflowFields
      }
    }
    ${fragments.workflowFields}
  `,
  execution: `
    query Execution($id: ID!) {
      execution(id: $id) {
        ...ExecutionFields
        steps { nodeId nodeName status durationMs error }
      }
    }
    ${fragments.executionFields}
  `,
  executions: `
    query Executions($workflowId: ID, $limit: Int) {
      executions(workflowId: $workflowId, limit: $limit) {
        ...ExecutionFields
      }
    }
    ${fragments.executionFields}
  `,
  dashboard: `
    query Dashboard($id: ID!) {
      dashboard(id: $id) {
        id
        title
        description
        layout
        status
        version
        createdAt
      }
    }
  `,
  connector: `
    query Connector($id: ID!) {
      connector(id: $id) {
        id
        name
        slug
        description
        version
        trustLevel
        authMethods
      }
    }
  `,
};
