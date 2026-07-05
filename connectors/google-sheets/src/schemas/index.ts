export const googleSheetsSchemas = {
  readRange: {
    input: {
      type: "object",
      properties: {
        spreadsheetId: {
          type: "string",
          description: "Google Sheets spreadsheet ID",
        },
        range: {
          type: "string",
          description: "A1 notation range (e.g., Sheet1!A1:D10)",
        },
        majorDimension: {
          type: "string",
          description: "ROWS or COLUMNS",
          enum: ["ROWS", "COLUMNS"],
        },
      },
      required: ["spreadsheetId", "range"],
    },
    output: {
      type: "object",
      properties: {
        values: { type: "array" },
        range: { type: "string" },
      },
    },
  },
  writeRange: {
    input: {
      type: "object",
      properties: {
        spreadsheetId: {
          type: "string",
          description: "Google Sheets spreadsheet ID",
        },
        range: { type: "string", description: "A1 notation range" },
        values: { type: "array", description: "2D array of values" },
        valueInputOption: { type: "string", enum: ["RAW", "USER_ENTERED"] },
      },
      required: ["spreadsheetId", "range", "values"],
    },
    output: {
      type: "object",
      properties: {
        updatedCells: { type: "number" },
        updatedRange: { type: "string" },
      },
    },
  },
  appendRow: {
    input: {
      type: "object",
      properties: {
        spreadsheetId: {
          type: "string",
          description: "Google Sheets spreadsheet ID",
        },
        range: { type: "string", description: "A1 notation range" },
        values: { type: "array", description: "Array of values for one row" },
        valueInputOption: { type: "string", enum: ["RAW", "USER_ENTERED"] },
      },
      required: ["spreadsheetId", "range", "values"],
    },
    output: {
      type: "object",
      properties: {
        appendedRange: { type: "string" },
        updatedCells: { type: "number" },
      },
    },
  },
};
