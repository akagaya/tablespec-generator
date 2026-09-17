import type { TableSpec } from './tablespec';

export interface ExportResult {
  filename: string;
  content: string;
  language: string;
}

export interface Exporter {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Brief description */
  description: string;
  /** File extension (e.g. ".sql", ".prisma") */
  fileExtension: string;
  /** Generate export content from a TableSpec */
  generate(spec: TableSpec): ExportResult | ExportResult[];
}

