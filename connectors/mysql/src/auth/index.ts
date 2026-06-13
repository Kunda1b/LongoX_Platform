export const postgresAuthConfig = {
  type: "basic" as const,
  fields: [
    { key: "host", label: "Host", type: "string", required: true },
    { key: "port", label: "Port", type: "number", default: 5432 },
    { key: "database", label: "Database", type: "string", required: true },
    { key: "username", label: "Username", type: "string", required: true },
    { key: "password", label: "Password", type: "password", required: true },
    { key: "ssl", label: "SSL", type: "boolean", default: true },
  ],
  buildConnectionString(fields: Record<string, string>): string {
    const sslParam =
      fields.ssl === "true" || fields.ssl === true ? "?sslmode=require" : "";
    return `postgresql://${fields.username}:${fields.password}@${fields.host}:${fields.port}/${fields.database}${sslParam}`;
  },
};
