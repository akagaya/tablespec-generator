import type { Exporter, ExportResult } from '../types/exporter';
import type { TableSpec } from '../types/tablespec';

export const jsonExporter: Exporter = {
  id: 'json',
  name: 'TableSpec JSON',
  description: 'Export as TableSpec JSON format',
  fileExtension: '.json',
  generate(spec: TableSpec): ExportResult {
    // 常にプロパティの順番を固定する
    const orderedSpec = {
      version: spec.version,
      projectName: spec.projectName,
      database: spec.database,
      tables: spec.tables,
    };

    return {
      filename: 'tablespec.json',
      content: JSON.stringify(orderedSpec, null, 2),
      language: 'json',
    };
  },
};
