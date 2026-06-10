import type { DataSourceAdapter } from "../domain";
import { PostgresAdapter, RestApiAdapter } from "../domain";

export class AdapterRegistry {
  private adapters = new Map<string, DataSourceAdapter>();

  constructor() {
    this.register(new PostgresAdapter());
    this.register(new RestApiAdapter());
  }

  register(adapter: DataSourceAdapter): void {
    this.adapters.set(adapter.kind, adapter);
  }

  get(kind: string): DataSourceAdapter | undefined {
    return this.adapters.get(kind);
  }

  getAvailableKinds(): string[] {
    return Array.from(this.adapters.keys());
  }
}
