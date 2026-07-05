import type { ConnectorDefinition } from "@longox/connector-runtime";
import { connectorRegistry } from "@longox/connector-runtime";
import { readRange, writeRange, appendRow } from "./actions";
import { rowAdded } from "./triggers";

export const googleSheetsConnector: ConnectorDefinition = {
  name: "google-sheets",
  version: "1.0.0",
  auth: ["oauth2"],
  actions: [
    {
      id: "readRange",
      name: "Read Range",
      description: "Read values from a spreadsheet range",
      inputSchema: {
        spreadsheetId: "string",
        range: "string",
        majorDimension: "string?",
      },
      outputSchema: { values: "array", range: "string" },
      idempotent: true,
    },
    {
      id: "writeRange",
      name: "Write Range",
      description: "Write values to a spreadsheet range",
      inputSchema: {
        spreadsheetId: "string",
        range: "string",
        values: "array",
        valueInputOption: "string?",
      },
      outputSchema: { updatedCells: "number", updatedRange: "string" },
      idempotent: false,
    },
    {
      id: "appendRow",
      name: "Append Row",
      description: "Append a row to a spreadsheet",
      inputSchema: {
        spreadsheetId: "string",
        range: "string",
        values: "array",
        valueInputOption: "string?",
      },
      outputSchema: { appendedRange: "string", updatedCells: "number" },
      idempotent: false,
    },
  ],
  triggers: [
    {
      id: "rowAdded",
      name: "Row Added",
      description: "Poll for new rows in a sheet",
      type: "polling",
      outputSchema: {
        spreadsheetId: "string",
        range: "string",
        values: "array",
      },
    },
  ],
  permissions: ["sheets:read", "sheets:write"],
};

connectorRegistry.register(googleSheetsConnector);
connectorRegistry.registerAction("google-sheets", {
  definition: googleSheetsConnector.actions[0],
  handler: readRange,
});
connectorRegistry.registerAction("google-sheets", {
  definition: googleSheetsConnector.actions[1],
  handler: writeRange,
});
connectorRegistry.registerAction("google-sheets", {
  definition: googleSheetsConnector.actions[2],
  handler: appendRow,
});
connectorRegistry.registerTrigger("google-sheets", {
  definition: googleSheetsConnector.triggers[0],
  handler: rowAdded,
});

export default googleSheetsConnector;
