import type { Exporter, ExportResult } from '../types/exporter';
import type { TableSpec } from '../types/tablespec';

/** エクスポータを実行し、結果を常に配列で返す。失敗時は空配列。 */
export function runExporter(exporter: Exporter | undefined, spec: TableSpec): ExportResult[] {
  if (!exporter) return [];
  try {
    const result = exporter.generate(spec);
    return Array.isArray(result) ? result : [result];
  } catch (error) {
    console.error(`Export error (${exporter.id}):`, error);
    return [];
  }
}
