export interface SandboxAuditEntry {
  timestamp: string;
  sandboxId: string;
  connectorName: string;
  executionId: string;
  actionId: string;
  tenantId: string;
  policy: {
    maxCpuMs: number;
    maxMemoryMb: number;
    timeoutMs: number;
    maxNetworkRequests: number;
    allowedDomainsCount: number;
  };
  result: "allowed" | "denied" | "error";
  reason?: string;
  durationMs: number;
  networkRequests: number;
  peakMemoryMb: number;
  cpuUsedMs: number;
}

export interface AuditLogger {
  record(entry: SandboxAuditEntry): Promise<void> | void;
  query(filters: Partial<SandboxAuditEntry>): Promise<SandboxAuditEntry[]>;
}

export class ConsoleAuditLogger implements AuditLogger {
  private entries: SandboxAuditEntry[] = [];
  private maxEntries = 10_000;

  record(entry: SandboxAuditEntry): void {
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
    const msg = `[sandbox:${entry.result}] ${entry.connectorName}/${entry.actionId} tenant=${entry.tenantId} duration=${entry.durationMs}ms net=${entry.networkRequests} cpu=${entry.cpuUsedMs}ms mem=${entry.peakMemoryMb}MB`;
    if (entry.result === "denied") {
      console.warn(msg, entry.reason ?? "");
    } else if (entry.result === "error") {
      console.error(msg, entry.reason ?? "");
    } else {
      console.log(msg);
    }
  }

  async query(
    filters: Partial<SandboxAuditEntry>,
  ): Promise<SandboxAuditEntry[]> {
    return this.entries.filter((e) =>
      Object.entries(filters).every(([k, v]) => (e as any)[k] === v),
    );
  }
}

export const auditLogger = new ConsoleAuditLogger();
