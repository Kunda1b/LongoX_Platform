export const mysqlAuthConfig = {
  type: "basic" as const,
  fields: [
    { key: "host", label: "Host", type: "string", required: true },
    { key: "port", label: "Port", type: "number", default: 3306 },
    { key: "database", label: "Database", type: "string", required: true },
    { key: "username", label: "Username", type: "string", required: true },
    { key: "password", label: "Password", type: "password", required: true },
  ],
  buildConnectionString(fields: Record<string, string>): string {
    return `mysql://${encodeURIComponent(fields.username)}:${encodeURIComponent(fields.password)}@${fields.host}:${fields.port ?? "3306"}/${fields.database}`;
  },
};
