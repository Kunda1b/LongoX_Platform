/**
 * Type declaration for `parquetjs-lite`.
 *
 * The package ships without its own TypeScript declarations. We declare a
 * minimal shape covering the methods used by `archive-export.service.ts`
 * and `cold-query.service.ts`.
 *
 * If the package later ships its own types, this file can be deleted.
 */

declare module "parquetjs-lite" {
  export interface ParquetField {
    name: string;
    type: string;
    repetitionType?: "REQUIRED" | "OPTIONAL" | "REPEATED";
    encoding?: string;
    compression?: string;
    path?: string[];
  }

  export interface ParquetSchemaDef {
    [fieldName: string]: {
      type: string;
      optional?: boolean;
      encoding?: string;
      compression?: string;
    };
  }

  export class ParquetSchema {
    constructor(fields: Record<string, unknown>);
  }

  export interface Cursor {
    next(): Promise<Record<string, unknown> | null>;
    nextBatch(size: number): Promise<Record<string, unknown>[]>;
  }

  export class ParquetWriter {
    static createFile(
      schema: ParquetSchema | ParquetSchemaDef | Record<string, unknown>,
      path: string,
      opts?: Record<string, unknown>,
    ): Promise<ParquetWriter>;
    static openFile(
      schema: ParquetSchema | ParquetSchemaDef | Record<string, unknown>,
      path: string,
      opts?: Record<string, unknown>,
    ): Promise<ParquetWriter>;
    writeRow(row: Record<string, unknown>): Promise<void>;
    appendRow(row: Record<string, unknown>): Promise<void>;
    close(): Promise<void>;
  }

  export class ParquetReader {
    static openFile(path: string): Promise<ParquetReader>;
    next(): Promise<Record<string, unknown> | null>;
    close(): Promise<void>;
    getRowCount(): number;
    getCursor(): Cursor;
  }

  const _default: {
    ParquetWriter: typeof ParquetWriter;
    ParquetReader: typeof ParquetReader;
    ParquetSchema: typeof ParquetSchema;
  };
  export default _default;
}
