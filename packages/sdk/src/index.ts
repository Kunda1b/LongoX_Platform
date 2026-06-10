export {
  AuthClient,
  type AuthConfig,
  type AuthSession,
} from "./auth-sdk/index.ts";
export {
  WorkflowClient,
  type WorkflowConfig,
  type WorkflowDefinition,
} from "./workflow-sdk/index.ts";
export {
  ConnectorClient,
  type ConnectorConfig,
  type ConnectorDefinition,
} from "./connector-sdk/index.ts";
export {
  TriggerClient,
  type TriggerConfig,
  type TriggerDefinition,
} from "./trigger-sdk/index.ts";
export { TestingClient, type TestingConfig } from "./testing-sdk/index.ts";

export type SdkConfig = {
  baseUrl: string;
  apiKey?: string;
  token?: string;
};

export class FlowBuilder {
  private config: SdkConfig;
  auth: AuthClient;
  workflow: WorkflowClient;
  connector: ConnectorClient;
  trigger: TriggerClient;
  testing: TestingClient;

  constructor(config: SdkConfig) {
    this.config = config;
    this.auth = new AuthClient(config);
    this.workflow = new WorkflowClient(config);
    this.connector = new ConnectorClient(config);
    this.trigger = new TriggerClient(config);
    this.testing = new TestingClient(config);
  }

  setToken(token: string): void {
    this.config.token = token;
  }

  setApiKey(key: string): void {
    this.config.apiKey = key;
  }
}
